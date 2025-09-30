import 'package:ionhive_technician_app/core/core.dart';
import 'package:ionhive_technician_app/core/services/endpoint.dart';

class TechnicianAuthUrls {
  static final Endpoint loginWithEmail = Endpoint(
    url: '${Core.baseUrl}/api/app/auth/technicianlogin',
    method: 'POST',
  );
}
