import 'package:ionhive_water_purifier/core/services/base_api_service.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/auth/data/urls.dart';

class AppUserAuthAPICalls extends BaseApiService {
  Future<Map<String, dynamic>> GetOTP(String email) async {
    return makeRequest<Map<String, dynamic>>(
      url: AppUserAuthUrl.GetOTP.url,
      method: AppUserAuthUrl.GetOTP.method,
      body: {'email': email, 'role_id': 3},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> authenticateOTP(String email, String otp) async {
    return makeRequest<Map<String, dynamic>>(
      url: AppUserAuthUrl.AuthenticateOTP.url,
      method: AppUserAuthUrl.AuthenticateOTP.method,
      body: {'email': email, 'otp': otp, 'role_id': 3},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> GoogleSignIN(String idToken) async {
    return makeRequest<Map<String, dynamic>>(
      url: AppUserAuthUrl.GoogleSignIN.url,
      method: AppUserAuthUrl.GoogleSignIN.method,
      body: {'idToken': idToken},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> AppleSignIN(String idToken) async {
    return makeRequest<Map<String, dynamic>>(
      url: AppUserAuthUrl.AppleSignIN.url,
      method: AppUserAuthUrl.AppleSignIN.method,
      body: {'idToken': idToken},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
