import 'package:ionhive_technician_app/core/core.dart';
import 'package:ionhive_technician_app/core/services/endpoint.dart';

class SettingsUrl {
  static final Endpoint FetchUserDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/fetchuserdetails',
    method: 'POST',
  );

  static final Endpoint UpdateUserDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/updateuserdetails',
    method: 'POST',
  );

  static final Endpoint RequestLeave = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/requestLeave',
    method: 'POST',
  );

  static final Endpoint GetTechnicianLeaveRequests = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/getTechnicianLeaveRequests',
    method: 'POST',
  );
}
