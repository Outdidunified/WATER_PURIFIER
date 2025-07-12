import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SessionController extends GetxController {
  var isLoggedIn = false.obs;
  var userId = 0.obs;
  var username = ''.obs;
  var token = ''.obs;
  var emailId = ''.obs;
  var userRole = 0.obs;
  var isSubscribed = false.obs; // <-- new field
  var technicianId = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadSession();
  }

  Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();

    isLoggedIn.value = prefs.getBool('isLoggedIn') ?? false;
    userId.value = prefs.getInt('userId') ?? 0;
    username.value = prefs.getString('username') ?? '';
    emailId.value = prefs.getString('emailId') ?? '';
    token.value = prefs.getString('token') ?? '';
    userRole.value = prefs.getInt('userRole') ?? 0;
    isSubscribed.value = prefs.getBool('isSubscribed') ?? false; // <-- load
    technicianId.value = prefs.getString('technicianId') ?? '';
  }

  Future<void> saveSession({
    required int userId,
    required String emailId,
    required String token,
    required int userRole,
    bool? isSubscribed, // optional for technician
    String? technicianId, // optional for user
    String? username,
  }) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setBool('isLoggedIn', true);
    await prefs.setInt('userId', userId);
    await prefs.setString('emailId', emailId);
    await prefs.setString('token', token);
    await prefs.setInt('userRole', userRole);

    if (userRole == 3 && isSubscribed != null) {
      await prefs.setBool('isSubscribed', isSubscribed);
      this.isSubscribed.value = isSubscribed;
    } else {
      await prefs.remove('isSubscribed');
      this.isSubscribed.value = false;
    }

    if (userRole == 2 && technicianId != null) {
      await prefs.setString('technicianId', technicianId);
      this.technicianId.value = technicianId;
    } else {
      await prefs.remove('technicianId');
      this.technicianId.value = '';
    }

    if (username != null && username.isNotEmpty) {
      await prefs.setString('username', username);
      this.username.value = username;
    } else {
      await prefs.remove('username');
      this.username.value = '';
    }

    isLoggedIn.value = true;
    this.userId.value = userId;
    this.emailId.value = emailId;
    this.token.value = token;
    this.userRole.value = userRole;
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    isLoggedIn.value = false;
    userId.value = 0;
    username.value = '';
    token.value = '';
    emailId.value = '';
    userRole.value = 0;
    isSubscribed.value = false; // <-- reset
    technicianId.value = '';
  }
}
