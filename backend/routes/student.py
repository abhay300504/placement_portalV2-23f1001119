from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db
from models import StudentProfile, PlacementDrive, Application
from werkzeug.utils import secure_filename
import os

student_bp = Blueprint('student', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def student_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'student':
            return jsonify({'error': 'Student access required'}), 403
        return f(*args, **kwargs)
    return decorated

def get_student_profile(user_id):
    return StudentProfile.query.filter_by(user_id=user_id).first()


# ── STUDENT DASHBOARD ───────────────────────────────────────
@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@student_required
def dashboard():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    # Get all approved drives
    drives_query = PlacementDrive.query.filter_by(status='approved')

    # Eligibility filter (drives student qualifies for)
    all_approved_drives = drives_query.all()
    eligible_drives = []

    for drive in all_approved_drives:
        # Check CGPA
        if student.cgpa and drive.eligibility_cgpa and student.cgpa < drive.eligibility_cgpa:
            continue
        # Check year
        if student.year and drive.eligibility_year and student.year != drive.eligibility_year:
            continue
        # Check branch
        if drive.eligibility_branch:
            allowed_branches = [b.strip() for b in drive.eligibility_branch.split(',')]
            if student.branch and student.branch not in allowed_branches:
                continue
        eligible_drives.append(drive.to_dict())

    # Student's applications
    applications = Application.query.filter_by(student_id=student.id).all()

    return jsonify({
        'student': student.to_dict(),
        'eligible_drives': eligible_drives,
        'applications': [a.to_dict() for a in applications]
    }), 200


# ── VIEW ALL APPROVED DRIVES (with search/filter) ───────────
@student_bp.route('/drives', methods=['GET'])
@jwt_required()
@student_required
def get_drives():
    search   = request.args.get('search', '')
    branch   = request.args.get('branch', '')
    min_pkg  = request.args.get('min_package', type=float)
    location = request.args.get('location', '')

    query = PlacementDrive.query.filter_by(status='approved')

    if search:
        query = query.filter(
            (PlacementDrive.job_title.ilike(f'%{search}%')) |
            (PlacementDrive.job_description.ilike(f'%{search}%'))
        )
    if branch:
        query = query.filter(PlacementDrive.eligibility_branch.ilike(f'%{branch}%'))
    if min_pkg:
        query = query.filter(PlacementDrive.package_lpa >= min_pkg)
    if location:
        query = query.filter(PlacementDrive.location.ilike(f'%{location}%'))

    drives = query.all()
    return jsonify([d.to_dict() for d in drives]), 200


# ── APPLY TO A DRIVE ─────────────────────────────────────────
@student_bp.route('/drives/<int:drive_id>/apply', methods=['POST'])
@jwt_required()
@student_required
def apply_to_drive(drive_id):
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    if student.is_blacklisted:
        return jsonify({'error': 'Blacklisted students cannot apply'}), 403

    drive = PlacementDrive.query.get_or_404(drive_id)

    if drive.status != 'approved':
        return jsonify({'error': 'This drive is not open for applications'}), 400

    # Check deadline
    from datetime import datetime
    if drive.application_deadline and datetime.utcnow() > drive.application_deadline:
        return jsonify({'error': 'Application deadline has passed'}), 400

    # Eligibility checks
    if drive.eligibility_cgpa and student.cgpa and student.cgpa < drive.eligibility_cgpa:
        return jsonify({'error': f'Minimum CGPA required: {drive.eligibility_cgpa}'}), 400

    if drive.eligibility_year and student.year and student.year != drive.eligibility_year:
        return jsonify({'error': f'This drive is for year {drive.eligibility_year} students only'}), 400

    if drive.eligibility_branch:
        allowed = [b.strip() for b in drive.eligibility_branch.split(',')]
        if student.branch and student.branch not in allowed:
            return jsonify({'error': f'Your branch is not eligible. Allowed: {drive.eligibility_branch}'}), 400

    # Prevent duplicate applications
    existing = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
    if existing:
        return jsonify({'error': 'You have already applied to this drive'}), 409

    application = Application(student_id=student.id, drive_id=drive_id)
    db.session.add(application)
    db.session.commit()

    return jsonify({'message': 'Applied successfully!', 'application': application.to_dict()}), 201


# ── VIEW APPLICATION HISTORY ─────────────────────────────────
@student_bp.route('/applications', methods=['GET'])
@jwt_required()
@student_required
def my_applications():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)
    apps = Application.query.filter_by(student_id=student.id).all()
    return jsonify([a.to_dict() for a in apps]), 200


# ── UPDATE STUDENT PROFILE ───────────────────────────────────
@student_bp.route('/profile', methods=['PUT'])
@jwt_required()
@student_required
def update_profile():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    data = request.get_json()
    updatable = ['name', 'phone', 'branch', 'year', 'cgpa', 'roll_number']
    for field in updatable:
        if field in data:
            setattr(student, field, data[field])

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'student': student.to_dict()}), 200


# ── UPLOAD RESUME ────────────────────────────────────────────
@student_bp.route('/profile/resume', methods=['POST'])
@jwt_required()
@student_required
def upload_resume():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['resume']
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF, DOC, DOCX files are allowed'}), 400

    filename = secure_filename(f"student_{student.id}_{file.filename}")
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    student.resume_path = filename
    db.session.commit()

    return jsonify({'message': 'Resume uploaded successfully', 'resume': filename}), 200


# ── TRIGGER CSV EXPORT (Async) ───────────────────────────────
@student_bp.route('/export-applications', methods=['POST'])
@jwt_required()
@student_required
def export_applications():
    user_id = get_jwt_identity()
    student = get_student_profile(user_id)

    # Import celery task and trigger it
    from tasks.export_csv import export_student_csv
    task = export_student_csv.delay(student.id, student.user.email)

    return jsonify({
        'message': 'CSV export started. You will receive an email when done.',
        'task_id': task.id
    }), 202