import os
import argparse
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_oauth_credentials():
    """
    Authenticate user via OAuth 2.0 Web Flow and cache credentials in token.json.
    Expects 'credentials.json' from Google Cloud Console in the same folder.
    """
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                raise FileNotFoundError(
                    "Missing 'credentials.json' file. Please download it from "
                    "Google Cloud Console -> APIs & Services -> Credentials."
                )
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
            
    return creds

def get_service_account_credentials(key_file):
    """
    Authenticate backend service using Google Service Account key file (.json).
    """
    if not os.path.exists(key_file):
        raise FileNotFoundError(f"Service Account key file '{key_file}' not found.")
    return service_account.Credentials.from_service_account_file(key_file, scopes=SCOPES)

def upload_file(local_path, drive_filename, mime_type, use_service_account=False, sa_key_file='service_account.json'):
    """
    Uploads a local file to Google Drive.
    """
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Local file '{local_path}' does not exist.")

    # 1. Authenticate
    print("Authenticating credentials...")
    if use_service_account:
        creds = get_service_account_credentials(sa_key_file)
    else:
        creds = get_oauth_credentials()

    # 2. Build the Drive API client
    service = build('drive', 'v3', credentials=creds)

    # 3. Setup file metadata and media upload container
    file_metadata = {'name': drive_filename}
    media = MediaFileUpload(local_path, mimetype=mime_type, resumable=True)

    print(f"Uploading '{local_path}' to Google Drive as '{drive_filename}'...")
    
    # 4. Perform upload call
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, name, webViewLink'
    ).execute()

    print("\n✅ Upload Complete!")
    print(f"File Name: {file.get('name')}")
    print(f"File ID:   {file.get('id')}")
    print(f"View Link: {file.get('webViewLink')}")
    return file

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Upload a local file to Google Drive using Drive API v3.")
    parser.add_argument('--file', required=True, help="Path to local file to upload")
    parser.add_argument('--name', help="Output name for file on Google Drive (defaults to local file name)")
    parser.add_argument('--mime', default='text/plain', help="MIME type of the file (default: text/plain)")
    parser.add_argument('--service-account', action='store_true', help="Use Service Account instead of user OAuth")
    parser.add_argument('--key-file', default='service_account.json', help="Path to service account JSON key file")

    args = parser.parse_args()
    
    filename = args.name if args.name else os.path.basename(args.file)
    
    try:
        upload_file(
            local_path=args.file,
            drive_filename=filename,
            mime_type=args.mime,
            use_service_account=args.service_account,
            sa_key_file=args.key_file
        )
    except Exception as e:
        print(f"\n❌ Error: {e}")
