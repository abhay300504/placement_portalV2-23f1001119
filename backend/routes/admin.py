from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db
from models import User, StudentProfile, CompanyProfile, PlacementDrive, Application

admin_bp = Blueprint('admin', __name__)

# ── Helper: Verify Admin ────────────────────────────────────
def admin_required():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


# ── DASHBOARD STATS ─────────────────────────────────────────
@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    stats = {
        'total_students':  StudentProfile.query.count(),
        'total_companies': CompanyProfile.query.count(),
        'total_drives':    PlacementDrive.query.count(),
        'pending_companies': CompanyProfile.query.filter_by(approval_status='pending').count(),
        'pending_drives':    PlacementDrive.query.filter_by(status='pending').count(),
        'total_applications': Application.query.count(),
        'selected_students': Application.query.filter_by(status='selected').count()
    }
    return jsonify(stats), 200


# ── LIST ALL COMPANIES ──────────────────────────────────────
@admin_bp.route('/companies', methods=['GET'])
@jwt_required()
def get_companies():
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    search = request.args.get('search', '')
    status = request.args.get('status', '')   # pending/approved/rejected

    query = CompanyProfile.query
    if search:
        query = query.filter(CompanyProfile.company_name.ilike(f'%{search}%'))
    if status:
        query = query.filter_by(approval_status=status)

    companies = query.all()
    return jsonify([c.to_dict() for c in companies]), 200


# ── APPROVE / REJECT COMPANY ────────────────────────────────
@admin_bp.route('/companies/<int:company_id>/status', methods=['PUT'])
@jwt_required()
def update_company_status(company_id):
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'

    if action not in ['approve', 'reject']:
        return jsonify({'error': 'action must be approve or reject'}), 400

    company = CompanyProfile.query.get_or_404(company_id)
    company.approval_status = 'approved' if action == 'approve' else 'rejected'
    db.session.commit()

    return jsonify({'message': f'Company {action}d successfully', 'company': company.to_dict()}), 200


# ── BLACKLIST / DEACTIVATE COMPANY ─────────────────────────
@admin_bp.route('/companies/<int:company_id>/blacklist', methods=['PUT'])
@jwt_required()
def blacklist_company(company_id):
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    blacklist = data.get('blacklist', True)  # True = blacklist, False = unblacklist

    company = CompanyProfile.query.get_or_404(company_id)
    company.is_blacklisted = blacklist
    db.session.commit()

    status = 'blacklisted' if blacklist else 'removed from blacklist'
    return jsonify({'message': f'Company {status}'}), 200


# ── LIST ALL STUDENTS ───────────────────────────────────────
@admin_bp.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    search = request.args.get('search', '')
    branch = request.args.get('branch', '')

    query = StudentProfile.query
    if search:
        query = query.filter(
            (StudentProfile.name.ilike(f'%{search}%')) |
            (StudentProfile.roll_number.ilike(f'%{search}%'))
        )
    if branch:
        query = query.filter_by(branch=branch)

    students = query.all()
    return jsonify([s.to_dict() for s in students]), 200


# ── BLACKLIST STUDENT ───────────────────────────────────────
@admin_bp.route('/students/<int:student_id>/blacklist', methods=['PUT'])
@jwt_required()
def blacklist_student(student_id):
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    blacklist = data.get('blacklist', True)

    student = StudentProfile.query.get_or_404(student_id)
    student.is_blacklisted = blacklist
    db.session.commit()

    status = 'blacklisted' if blacklist else 'removed from blacklist'
    return jsonify({'message': f'Student {status}'}), 200


# ── DEACTIVATE USER ACCOUNT ─────────────────────────────────
@admin_bp.route('/users/<int:user_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_user(user_id):
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    active = data.get('is_active', False)

    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        return jsonify({'error': 'Cannot deactivate admin'}), 400
    user.is_active = active
    db.session.commit()

    return jsonify({'message': f'User {"activated" if active else "deactivated"}'}), 200


# ── LIST ALL DRIVES ─────────────────────────────────────────
@admin_bp.route('/drives', methods=['GET'])
@jwt_required()
def get_drives():
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    status = request.args.get('status', '')
    query = PlacementDrive.query
    if status:
        query = query.filter_by(status=status)

    drives = query.all()
    return jsonify([d.to_dict() for d in drives]), 200


# ── APPROVE / REJECT DRIVE ──────────────────────────────────
@admin_bp.route('/drives/<int:drive_id>/status', methods=['PUT'])
@jwt_required()
def update_drive_status(drive_id):
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    action = data.get('action')  # 'approve', 'reject', 'close'

    if action not in ['approve', 'reject', 'close']:
        return jsonify({'error': 'action must be approve, reject, or close'}), 400

    drive = PlacementDrive.query.get_or_404(drive_id)

    if action == 'approve':
        drive.status = 'approved'
    elif action == 'reject':
        drive.status = 'rejected'
    elif action == 'close':
        drive.status = 'closed'

    db.session.commit()
    return jsonify({'message': f'Drive {action}d', 'drive': drive.to_dict()}), 200


# ── VIEW ALL APPLICATIONS ───────────────────────────────────
@admin_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_all_applications():
    if not admin_required():
        return jsonify({'error': 'Admin access required'}), 403

    apps = Application.query.all()
    return jsonify([a.to_dict() for a in apps]), 200