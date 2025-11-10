import 'package:ionhive_technician_app/core/core.dart';
import 'package:ionhive_technician_app/core/services/endpoint.dart';

class TasknUrl {
  static final Endpoint getAllAssignedTaskDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/getAllAssignedTaskDetails',
    method: 'POST',
  );

  static final Endpoint updateTaskDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/updateTaskDetails',
    method: 'POST',
  );

  static final Endpoint acceptDeclineTask = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/acceptDeclineTask',
    method: 'POST',
  );

  static final Endpoint updateInProgressTaskLeaveAction = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/updateInProgressTaskLeaveAction',
    method: 'POST',
  );

  static final Endpoint setupBleConnection = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/setupBleConnection',
    method: 'POST',
  );

  static final Endpoint getProductsWithPlans = Endpoint(
    url: '${Core.baseUrl}/api/website/products/productswithplan',
    method: 'GET',
  );

  static final Endpoint createRechargeOrder = Endpoint(
    url: '${Core.baseUrl}/api/app/technicianhome/createRechargeOrder',
    method: 'POST',
  );

  static final Endpoint getActiveSubscriptionDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/enduserhome/getActiveSubscriptionDetails',
    method: 'POST',
  );
}
