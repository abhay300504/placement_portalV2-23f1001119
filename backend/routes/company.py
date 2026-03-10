from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db
from models import CompanyProfile, PlacementDrive, Application, StudentProfile
from datetime import datetime

company_bp = Blueprint('company', __name__)

def get_company_profile(user_id):
    return CompanyProfile.query.filter_by(user_id=user_id).first()

def company_required(f):
    """Decorator to check company role and approval"""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'company':
            return jsonify({'error': 'Company access required'}), 403
        return f(*args, **kwargs)
    return decorated


# COMPANY DASHBOARD
@company_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@company_required
def dashboard():
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)
    if not company:
        return jsonify({'error': 'Company profile not found'}), 404

    drives = PlacementDrive.query.filter_by(company_id=company.id).all()
    drive_data = []
    for drive in drives:
        drive_dict = drive.to_dict()
        drive_dict['applicant_count'] = Application.query.filter_by(drive_id=drive.id).count()
        drive_data.append(drive_dict)

    return jsonify({
        'company': company.to_dict(),
        'drives': drive_data,
        'total_drives': len(drives),
        'total_applicants': sum(d['applicant_count'] for d in drive_data)
    }), 200


# CREATE PLACEMENT DRIVE
@company_bp.route('/drives', methods=['POST'])
@jwt_required()
@company_required
def create_drive():
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)

    if company.approval_status != 'approved':
        return jsonify({'error': 'Your company must be approved before creating drives'}), 403
    if company.is_blacklisted:
        return jsonify({'error': 'Blacklisted companies cannot create drives'}), 403

    data = request.get_json()

    required = ['job_title', 'application_deadline']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    try:
        deadline = datetime.fromisoformat(data['application_deadline'])
    except ValueError:
        return jsonify({'error': 'Invalid deadline format. Use ISO format: YYYY-MM-DDTHH:MM:SS'}), 400

    drive = PlacementDrive(
        company_id=company.id,
        job_title=data['job_title'],
        job_description=data.get('job_description'),
        eligibility_branch=data.get('eligibility_branch', ''),
        eligibility_cgpa=data.get('eligibility_cgpa', 0.0),
        eligibility_year=data.get('eligibility_year'),
        application_deadline=deadline,
        package_lpa=data.get('package_lpa'),
        location=data.get('location'),
        status='pending'
    )
    db.session.add(drive)
    db.session.commit()

    return jsonify({'message': 'Drive created and sent for admin approval', 'drive': drive.to_dict()}), 201


# GET COMPANY'S OWN DRIVES
@company_bp.route('/drives', methods=['GET'])
@jwt_required()
@company_required
def get_my_drives():
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)
    drives = PlacementDrive.query.filter_by(company_id=company.id).all()
    return jsonify([d.to_dict() for d in drives]), 200


# UPDATE A DRIVE
@company_bp.route('/drives/<int:drive_id>', methods=['PUT'])
@jwt_required()
@company_required
def update_drive(drive_id):
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)

    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    if data.get('job_title'):
        drive.job_title = data['job_title']
    if data.get('job_description') is not None:
        drive.job_description = data['job_description']
    if data.get('location') is not None:
        drive.location = data['location']
    if data.get('package_lpa') is not None:
        drive.package_lpa = data['package_lpa']
    if data.get('eligibility_branch') is not None:
        drive.eligibility_branch = data['eligibility_branch']
    if data.get('eligibility_cgpa') is not None:
        drive.eligibility_cgpa = data['eligibility_cgpa']
    if data.get('eligibility_year') is not None:
        drive.eligibility_year = data['eligibility_year']
    if data.get('application_deadline'):
        try:
            drive.application_deadline = datetime.fromisoformat(data['application_deadline'])
        except ValueError:
            return jsonify({'error': 'Invalid deadline format'}), 400

    db.session.commit()
    return jsonify({'message': 'Drive updated', 'drive': drive.to_dict()}), 200


# DELETE A DRIVE
@company_bp.route('/drives/<int:drive_id>', methods=['DELETE'])
@jwt_required()
@company_required
def delete_drive(drive_id):
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)

    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Delete all applications for this drive first
    Application.query.filter_by(drive_id=drive_id).delete()
    db.session.delete(drive)
    db.session.commit()
    return jsonify({'message': 'Drive deleted successfully'}), 200


# GET APPLICANTS FOR A DRIVE
@company_bp.route('/drives/<int:drive_id>/applications', methods=['GET'])
@jwt_required()
@company_required
def get_applications(drive_id):
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)

    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.company_id != company.id:
        return jsonify({'error': 'You do not own this drive'}), 403

    apps = Application.query.filter_by(drive_id=drive_id).all()
    return jsonify([a.to_dict() for a in apps]), 200


# UPDATE APPLICATION STATUS
@company_bp.route('/applications/<int:app_id>/status', methods=['PUT'])
@jwt_required()
@company_required
def update_application_status(app_id):
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)

    app = Application.query.get_or_404(app_id)

    if app.drive.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    new_status = data.get('status')

    if new_status not in ['applied', 'shortlisted', 'selected', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400

    app.status = new_status
    db.session.commit()

    return jsonify({'message': f'Application status updated to {new_status}', 'application': app.to_dict()}), 200


# GET COMPANY PROFILE
@company_bp.route('/profile', methods=['GET'])
@jwt_required()
@company_required
def get_profile():
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)
    if not company:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify(company.to_dict()), 200


# UPDATE COMPANY PROFILE
@company_bp.route('/profile', methods=['PUT'])
@jwt_required()
@company_required
def update_profile():
    user_id = get_jwt_identity()
    company = get_company_profile(user_id)

    data = request.get_json()
    if data.get('company_name'):
        company.company_name = data['company_name']
    if data.get('hr_contact_name') is not None:
        company.hr_contact_name = data['hr_contact_name']
    if data.get('hr_phone') is not None:
        company.hr_phone = data['hr_phone']
    if data.get('website') is not None:
        company.website = data['website']
    if data.get('description') is not None:
        company.description = data['description']

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'company': company.to_dict()}), 200