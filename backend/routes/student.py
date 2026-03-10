from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db
from models import StudentProfile, PlacementDrive, Application, CompanyProfile
from datetime import datetime
import os
from werkzeug.utils import secure_filename

student_bp = Blueprint('student', __name__)

def get_student_profile(user_id):
    return StudentProfile.query.filter_by(user_id=user_id).first()

def student_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'student':
            return jsonify({'error': 'Student access required'}), 403
        return f(*args, **kwargs)
    return decorated


# STUDENT DASHBOARD
@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@student_required
def dashboard():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)
    if not student:
        return jsonify({'error': 'Student profile not found'}), 404

    # Open drives (approved, deadline not passed)
    open_drives = PlacementDrive.query.filter_by(status='approved').all()
    open_drives_count = len(open_drives)

    # Student's applications
    applications = Application.query.filter_by(student_id=student.id).all()
    total_applications = len(applications)
    selected_count = sum(1 for a in applications if a.status == 'selected')

    # One row per open drive (company name + job title + drive_id for View Details)
    companies = []
    for drive in open_drives:
        c = drive.company
        companies.append({
            'id': str(c.id) + '_' + str(drive.id),
            'company_name': c.company_name,
            'job_title': drive.job_title,
            'drive_id': drive.id
        })

    # Recent applications (last 10)
    recent = Application.query.filter_by(student_id=student.id)\
        .order_by(Application.application_date.desc()).limit(10).all()

    return jsonify({
        'student': student.to_dict(),
        'open_drives': open_drives_count,
        'drives_count': open_drives_count,
        'applications_count': total_applications,
        'total_applications': total_applications,
        'selected_count': selected_count,
        'selected': selected_count,
        'companies': companies,
        'companies_count': len(companies),
        'recent_applications': [a.to_dict() for a in recent]
    }), 200


# BROWSE DRIVES
@student_bp.route('/drives', methods=['GET'])
@jwt_required()
@student_required
def get_drives():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    drives = PlacementDrive.query.filter_by(status='approved').all()
    result = []
    for drive in drives:
        d = drive.to_dict()
        # Check if student already applied
        existing = Application.query.filter_by(
            student_id=student.id, drive_id=drive.id
        ).first()
        d['has_applied'] = existing is not None
        d['applied'] = existing is not None
        d['application_status'] = existing.status if existing else None
        result.append(d)

    return jsonify(result), 200


# APPLY TO DRIVE
@student_bp.route('/drives/<int:drive_id>/apply', methods=['POST'])
@jwt_required()
@student_required
def apply_drive(drive_id):
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    if student.is_blacklisted:
        return jsonify({'error': 'You are blacklisted and cannot apply'}), 403

    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.status != 'approved':
        return jsonify({'error': 'This drive is not open for applications'}), 400

    if drive.application_deadline and datetime.utcnow() > drive.application_deadline:
        return jsonify({'error': 'Application deadline has passed'}), 400

    existing = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
    if existing:
        return jsonify({'error': 'You have already applied to this drive'}), 400

    app = Application(
        student_id=student.id,
        drive_id=drive_id,
        status='applied'
    )
    db.session.add(app)
    db.session.commit()

    return jsonify({'message': 'Application submitted successfully', 'application': app.to_dict()}), 201


# MY APPLICATIONS
@student_bp.route('/applications', methods=['GET'])
@jwt_required()
@student_required
def get_applications():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)
    apps = Application.query.filter_by(student_id=student.id)\
        .order_by(Application.application_date.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200


# GET STUDENT PROFILE
@student_bp.route('/profile', methods=['GET'])
@jwt_required()
@student_required
def get_profile():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)
    if not student:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify(student.to_dict()), 200


# UPDATE STUDENT PROFILE
@student_bp.route('/profile', methods=['PUT'])
@jwt_required()
@student_required
def update_profile():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    data = request.get_json()
    if data.get('name'):        student.name = data['name']
    if data.get('phone') is not None:  student.phone = data['phone']
    if data.get('branch') is not None: student.branch = data['branch']
    if data.get('cgpa') is not None:   student.cgpa = float(data['cgpa'])
    if data.get('year') is not None:   student.year = int(data['year'])

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'student': student.to_dict()}), 200


# UPLOAD RESUME
@student_bp.route('/profile/resume', methods=['POST'])
@jwt_required()
@student_required
def upload_resume():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    filename = secure_filename(f"resume_{student.id}_{int(datetime.utcnow().timestamp())}.pdf")
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    student.resume_path = filename
    db.session.commit()

    return jsonify({'message': 'Resume uploaded successfully', 'resume_path': filename}), 200