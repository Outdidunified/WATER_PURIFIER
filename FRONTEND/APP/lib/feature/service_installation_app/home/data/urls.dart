import 'package:aquapulse_app/core/core.dart';
import 'package:aquapulse_app/core/services/endpoint.dart';

class TasknUrl {
  static final Endpoint getAllAssignedTaskDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/getAllAssignedTaskDetails',
    method: 'POST',
  );

  static final Endpoint updateTaskDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/updateTaskDetails',
    method: 'POST',
  );
}
