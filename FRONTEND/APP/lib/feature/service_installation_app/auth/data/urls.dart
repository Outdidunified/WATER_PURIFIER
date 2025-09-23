import 'package:aquapulse_app/core/core.dart';
import 'package:aquapulse_app/core/services/endpoint.dart';

class TechnicianAuthUrls {
  static final Endpoint loginWithEmail = Endpoint(
    url: '${Core.baseUrl}/api/app/auth/technicianlogin',
    method: 'POST',
  );
}
