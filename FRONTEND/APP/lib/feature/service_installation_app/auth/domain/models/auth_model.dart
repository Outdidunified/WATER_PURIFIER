// OTP Verification Response Model {authenticateOTPandHandleLogin()}
class AuthResponse {
  final bool error;
  final String message;
  final String? token;
  final Map<String, dynamic>? data;

  AuthResponse({
    required this.error,
    required this.message,
    this.token,
    this.data,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      error: json['error'] as bool,
      message: json['message'] as String,
      token: json['token'],
      data: json['data'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'error': error,
      'message': message,
      if (token != null) 'token': token,
      if (data != null) 'data': data,
    };
  }
}
