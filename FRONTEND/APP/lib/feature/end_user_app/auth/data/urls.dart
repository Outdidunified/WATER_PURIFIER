import 'package:ionhive_water_purifier/core/core.dart';
import 'package:ionhive_water_purifier/core/services/endpoint.dart';

class AppUserAuthUrl {
  static final Endpoint GetOTP = Endpoint(
      url: '${Core.baseUrl}/api/website/auth/userlogingetotp', method: 'POST');
  static final Endpoint AuthenticateOTP = Endpoint(
      url: '${Core.baseUrl}/api/website/auth/verify-otp', method: 'POST');
  static final Endpoint GoogleSignIN = Endpoint(
      url: '${Core.baseUrl}/api/app/auth/googleSignIN', method: 'POST');
  static final Endpoint AppleSignIN =
      Endpoint(url: '${Core.baseUrl}/api/app/auth/AppleSignIN', method: 'POST');
}
