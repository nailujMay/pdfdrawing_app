import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate(r"C:\Users\julia\pdfdraw_app\flask_server\firebasePy\pdfdraw-30ab9-firebase-adminsdk-gxaom-069fc16c41.json")
firebase_admin.initialize_app(cred, {'storageBucket': 'pdfdraw-30ab9.appspot.com'})

bucket = storage.bucket()

