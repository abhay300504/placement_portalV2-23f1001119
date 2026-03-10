from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, StudentProfile, CompanyProfile, PlacementDrive, Application
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# DASHBOARD
@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def dashboard():
    total_students     = StudentProfile.query.count()
    total_companies    = CompanyProfile.query.count()
    total_drives       = PlacementDrive.query.count()
    total_applications = Application.query.count()
    pending_companies  = CompanyProfile.query.filter_by(approval_status='pending').count()
    pending_drives     = PlacementDrive.query.filter_by(status='pending').count()

    return jsonify({
        'total_students':     total_students,
        'total_companies':    total_companies,
        'total_drives':       total_drives,
        'total_applications': total_applications,
        'pending_companies':  pending_companies,
        'pending_drives':     pending_drives,
    }), 200

# COMPANIES
@admin_bp.route('/companies', methods=['GET'])
@jwt_required()
@admin_required
def get_companies():
    search = request.args.get('search', '')
    q = CompanyProfile.query
    if search:
        q = q.filter(CompanyProfile.company_name.ilike(f'%{search}%'))
    companies = q.order_by(CompanyProfile.id.desc()).all()
    result = []
    for c in companies:
        d = c.to_dict()
        d['email'] = c.user.email if c.user else ''
        result.append(d)
    return jsonify(result), 200

@admin_bp.route('/companies/<int:company_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_company_detail(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    drives  = PlacementDrive.query.filter_by(company_id=company_id).order_by(PlacementDrive.id.desc()).all()
    c_dict  = company.to_dict()
    c_dict['email'] = company.user.email if company.user else ''
    return jsonify({
        'company': c_dict,
        'drives':  [d.to_dict() for d in drives]
    }), 200

@admin_bp.route('/companies/<int:company_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_company_status(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    action  = request.json.get('action')
    if action == 'approve':
        company.approval_status = 'approved'
        company.user.is_active  = True
    elif action == 'reject':
        company.approval_status = 'rejected'
    else:
        return jsonify({'error': 'Invalid action'}), 400
    db.session.commit()
    return jsonify({'message': f'Company {action}d', 'company': company.to_dict()}), 200

@admin_bp.route('/companies/<int:company_id>/blacklist', methods=['PUT'])
@jwt_required()
@admin_required
def blacklist_company(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    company.is_blacklisted     = request.json.get('blacklist', True)
    company.user.is_active     = not company.is_blacklisted
    db.session.commit()
    return jsonify({'message': 'Updated', 'company': company.to_dict()}), 200

@admin_bp.route('/companies/<int:company_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_company(company_id):
    company = CompanyProfile.query.get_or_404(company_id)
    user = company.user
    # Delete applications → drives → company profile → user (in order)
    drives = PlacementDrive.query.filter_by(company_id=company_id).all()
    for drive in drives:
        Application.query.filter_by(drive_id=drive.id).delete()
        db.session.delete(drive)
    db.session.delete(company)
    if user: db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Company deleted'}), 200

# STUDENTS
@admin_bp.route('/students', methods=['GET'])
@jwt_required()
@admin_required
def get_students():
    search = request.args.get('search', '')
    q = StudentProfile.query
    if search:
        q = q.filter(StudentProfile.name.ilike(f'%{search}%'))
    students = q.order_by(StudentProfile.id.desc()).all()
    result = []
    for s in students:
        d = s.to_dict()
        d['email'] = s.user.email if s.user else ''
        result.append(d)
    return jsonify(result), 200

@admin_bp.route('/students/<int:student_id>/blacklist', methods=['PUT'])
@jwt_required()
@admin_required
def blacklist_student(student_id):
    student = StudentProfile.query.get_or_404(student_id)
    student.is_blacklisted = request.json.get('blacklist', True)
    student.user.is_active = not student.is_blacklisted
    db.session.commit()
    return jsonify({'message': 'Updated', 'student': student.to_dict()}), 200

@admin_bp.route('/students/<int:student_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_student(student_id):
    student = StudentProfile.query.get_or_404(student_id)
    data = request.get_json()
    if 'name'        in data: student.name         = data['name']
    if 'roll_number' in data: student.roll_number  = data['roll_number']
    if 'branch'      in data: student.branch       = data['branch']
    if 'year'        in data: student.year         = data['year']
    if 'cgpa'        in data: student.cgpa         = data['cgpa']
    if 'phone'       in data: student.phone        = data['phone']
    db.session.commit()
    return jsonify({'message': 'Student updated', 'student': student.to_dict()}), 200

@admin_bp.route('/students/<int:student_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_student(student_id):
    student = StudentProfile.query.get_or_404(student_id)
    user = student.user
    # Delete applications first, then student profile, then user
    Application.query.filter_by(student_id=student_id).delete()
    db.session.delete(student)
    if user: db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Student deleted'}), 200

# DRIVES
@admin_bp.route('/drives', methods=['GET'])
@jwt_required()
@admin_required
def get_drives():
    drives = PlacementDrive.query.order_by(PlacementDrive.id.desc()).all()
    result = []
    for d in drives:
        dd = d.to_dict()
        dd['company_name'] = d.company.company_name if d.company else ''
        result.append(dd)
    return jsonify(result), 200

@admin_bp.route('/drives/<int:drive_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_drive_detail(drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    apps  = Application.query.filter_by(drive_id=drive_id).all()
    d_dict = drive.to_dict()
    d_dict['company_name'] = drive.company.company_name if drive.company else ''
    applicants = []
    for a in apps:
        ad = a.to_dict()
        if a.student:
            ad['student_name']  = a.student.name
            ad['student_email'] = a.student.user.email if a.student.user else ''
            ad['branch']        = a.student.branch
            ad['cgpa']          = a.student.cgpa
        applicants.append(ad)
    return jsonify({
        'drive':      d_dict,
        'applicants': applicants
    }), 200

@admin_bp.route('/drives/<int:drive_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_drive_status(drive_id):
    drive  = PlacementDrive.query.get_or_404(drive_id)
    action = request.json.get('action')
    if action == 'approve':
        drive.status = 'approved'
    elif action == 'reject':
        drive.status = 'rejected'
    elif action == 'close':
        drive.status = 'closed'
    else:
        return jsonify({'error': 'Invalid action'}), 400
    db.session.commit()
    return jsonify({'message': f'Drive {action}d', 'drive': drive.to_dict()}), 200

# APPLICATIONS
@admin_bp.route('/applications', methods=['GET'])
@jwt_required()
@admin_required
def get_applications():
    apps = Application.query.order_by(Application.id.desc()).all()
    result = []
    for a in apps:
        d = a.to_dict()
        if a.student:
            d['student_name']  = a.student.name
            d['student_email'] = a.student.user.email if a.student.user else ''
        if a.drive:
            d['job_title']    = a.drive.job_title
            d['company_name'] = a.drive.company.company_name if a.drive.company else ''
        result.append(d)
    return jsonify(result), 200