import csv
import os
from celery_worker import celery
from models import Application, StudentProfile
from extensions import mail, db
from flask_mail import Message

@celery.task
def export_student_csv(student_id, student_email):
    """Async task: Export student applications to CSV and email it"""

    # Need app context - handled by ContextTask in extensions.py
    student = StudentProfile.query.get(student_id)
    applications = Application.query.filter_by(student_id=student_id).all()

    # Create CSV file
    filename = f'applications_student_{student_id}.csv'
    filepath = os.path.join('/tmp', filename)

    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        # Header row
        writer.writerow(['Student ID', 'Student Name', 'Company Name', 
                         'Drive Title', 'Application Status', 'Application Date'])
        # Data rows
        for app in applications:
            writer.writerow([
                student.id,
                student.name,
                app.drive.company.company_name,
                app.drive.job_title,
                app.status,
                app.application_date.strftime('%Y-%m-%d %H:%M')
            ])

    # Send email with CSV attached
    msg = Message(
        subject='Your Application History Export',
        recipients=[student_email],
        body=f'Hi {student.name},\n\nYour application history has been exported. Please find the CSV attached.\n\nPlacement Portal'
    )

    with open(filepath, 'rb') as f:
        msg.attach(filename, 'text/csv', f.read())

    mail.send(msg)

    # Cleanup temp file
    os.remove(filepath)
    return f'CSV exported and sent to {student_email}'