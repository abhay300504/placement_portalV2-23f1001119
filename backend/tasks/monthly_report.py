from celery_worker import celery
from celery.schedules import crontab
from models import PlacementDrive, Application, StudentProfile, CompanyProfile
from extensions import mail
from flask_mail import Message
from datetime import datetime, timedelta
from flask import current_app

@celery.task
def send_monthly_report():
    """Monthly task: Send placement activity report to admin"""

    # Get last month's date range
    today = datetime.utcnow()
    first_day_this_month = today.replace(day=1)
    last_month_end = first_day_this_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    # Stats for last month
    drives_conducted = PlacementDrive.query.filter(
        PlacementDrive.created_at >= last_month_start,
        PlacementDrive.created_at <= last_month_end
    ).count()

    apps_last_month = Application.query.filter(
        Application.application_date >= last_month_start,
        Application.application_date <= last_month_end
    ).all()

    students_applied   = len(set(a.student_id for a in apps_last_month))
    students_selected  = len([a for a in apps_last_month if a.status == 'selected'])
    total_applications = len(apps_last_month)

    month_name = last_month_end.strftime('%B %Y')

    html_report = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2c3e50;">📊 Monthly Placement Activity Report</h2>
        <h3>{month_name}</h3>
        <hr>
        <table border="1" cellpadding="10" cellspacing="0" width="100%">
            <tr style="background:#3498db; color:white;">
                <th>Metric</th><th>Count</th>
            </tr>
            <tr><td>Drives Conducted</td><td>{drives_conducted}</td></tr>
            <tr><td>Total Applications</td><td>{total_applications}</td></tr>
            <tr><td>Unique Students Applied</td><td>{students_applied}</td></tr>
            <tr><td>Students Selected</td><td>{students_selected}</td></tr>
        </table>
        <br>
        <p style="color:#7f8c8d;">Generated automatically by Placement Portal on {today.strftime('%Y-%m-%d')}</p>
    </body>
    </html>
    """

    admin_email = current_app.config['ADMIN_EMAIL']
    msg = Message(
        subject=f'📊 Monthly Placement Report - {month_name}',
        recipients=[admin_email],
        html=html_report
    )
    mail.send(msg)
    return f'Monthly report sent for {month_name}'