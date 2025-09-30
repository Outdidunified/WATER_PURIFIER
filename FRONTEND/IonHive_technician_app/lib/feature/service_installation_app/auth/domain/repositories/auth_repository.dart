import 'package:ionhive_technician_app/feature/service_installation_app/auth/data/api.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/auth/domain/models/auth_model.dart';

class TechnicianAuthRepository {
  final TechnicianAuthAPICalls _api = TechnicianAuthAPICalls();

  Future<AuthResponse> loginWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      final responseJson = await _api.login(email, password);
      return AuthResponse.fromJson(responseJson);
    } catch (e) {
      rethrow;
    }
  }
}
