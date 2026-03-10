from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import User, StudentProfile, CompanyProfile
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

# REGISTER (Student or Company)
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    required = ['email', 'password', 'role']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    role = data['role']
    if role not in ['student', 'company']:
        return jsonify({'error': 'Role must be student or company'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Create User
    user = User(email=data['email'], role=role)
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()  # Get user.id before committing

    # Create associated profile
    if role == 'student':
        if not data.get('name'):
            return jsonify({'error': 'name is required for student'}), 400
        profile = StudentProfile(
            user_id=user.id,
            name=data['name'],
            roll_number=data.get('roll_number'),
            branch=data.get('branch'),
            year=data.get('year'),
            cgpa=data.get('cgpa'),
            phone=data.get('phone')
        )
        db.session.add(profile)

    elif role == 'company':
        if not data.get('company_name'):
            return jsonify({'error': 'company_name is required for company'}), 400
        profile = CompanyProfile(
            user_id=user.id,
            company_name=data['company_name'],
            hr_contact_name=data.get('hr_contact_name'),
            hr_phone=data.get('hr_phone'),
            website=data.get('website'),
            description=data.get('description')
        )
        db.session.add(profile)

    db.session.commit()
    return jsonify({'message': f'{role.capitalize()} registered successfully. '
                               f'{"Await admin approval." if role == "company" else "You can now login."}'}), 201


# ── LOGIN ───────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Your account has been deactivated. Contact admin.'}), 403

    # Extra checks for company
    if user.role == 'company':
        company = user.company_profile
        if company.approval_status == 'pending':
            return jsonify({'error': 'Your company registration is pending admin approval.'}), 403
        if company.approval_status == 'rejected':
            return jsonify({'error': 'Your company registration was rejected.'}), 403
        if company.is_blacklisted:
            return jsonify({'error': 'Your company has been blacklisted.'}), 403

    if user.role == 'student':
        student = user.student_profile
        if student.is_blacklisted:
            return jsonify({'error': 'Your account has been blacklisted.'}), 403

    # Create JWT token (expires in 1 day)
    additional_claims = {'role': user.role}
    token = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims,
        expires_delta=timedelta(days=1)
    )

    return jsonify({
        'token': token,
        'role': user.role,
        'user_id': user.id,
        'message': 'Login successful'
    }), 200


# GET CURRENT USER INFO
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    result = user.to_dict()

    if user.role == 'student' and user.student_profile:
        result['profile'] = user.student_profile.to_dict()
    elif user.role == 'company' and user.company_profile:
        result['profile'] = user.company_profile.to_dict()

    return jsonify(result), 200