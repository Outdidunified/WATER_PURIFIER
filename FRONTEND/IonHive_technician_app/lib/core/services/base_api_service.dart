// core/services/base_api_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:get/get.dart';
import 'package:flutter/material.dart';
import '../../utils/exception/exception.dart';
import '../controllers/session_controller.dart';

abstract class BaseApiService {
  final SessionController _sessionController = Get.find<SessionController>();
  bool _tokenDialogShown = false;

  // Default error messages for HTTP status codes
  String _getDefaultErrorMessage(int statusCode) {
    switch (statusCode) {
      case 400:
        return '⚠️ Invalid request. Please check your input and try again.';
      case 401:
        return '🔒 Authentication failed. Please log in again.';
      case 403:
        return '🚫 Access denied. You do not have permission to access this resource.';
      case 404:
        return '🔍 Resource not found. The requested information is unavailable.';
      case 408:
        return '⏱️ Request timeout. Please check your connection and try again.';
      case 500:
        return '⚠️ Server error. Our team has been notified and is working on it.';
      case 502:
        return '🌐 Bad gateway. The server received an invalid response.';
      case 503:
        return '🛠️ Service unavailable. The server is temporarily down for maintenance.';
      case 504:
        return '⏱️ Gateway timeout. The server took too long to respond.';
      default:
        return '❗ Connection error (Code: $statusCode). Please try again later.';
    }
  }

  // Handle HTTP response and parse body
  Future<T> handleResponse<T>(
    http.Response response, {
    T Function(dynamic)? parser,
  }) async {
    try {
      final responseBody = jsonDecode(response.body);

      // Handle token invalidation
      if (responseBody is Map<String, dynamic> &&
          responseBody['invalidateToken'] == true) {
        final tokenMessage = responseBody['message']?.toString() ??
            'Your session is no longer valid. Please log in again.';
        _handleTokenExpired(tokenMessage);
        throw HttpException(response.statusCode, tokenMessage);
      }

      // ✅ Success case (status 200–299) or specific 400/401/402 with error: true
      if ((response.statusCode >= 200 && response.statusCode < 300) ||
          ((response.statusCode == 400 || response.statusCode == 401 || response.statusCode == 402) &&
              responseBody is Map<String, dynamic> &&
              responseBody['error'] == true)) {
        return parser != null ? parser(responseBody) : responseBody as T;
      }

      // ❗ Error case: Prioritize backend message
      String errorMessage;
      if (responseBody is Map<String, dynamic> &&
          responseBody['message'] != null &&
          responseBody['message'].toString().trim().isNotEmpty) {
        errorMessage = responseBody['message'].toString();
      } else {
        errorMessage = _getDefaultErrorMessage(response.statusCode);
      }

      debugPrint('API Error: $errorMessage (Status: ${response.statusCode})');
      throw HttpException(response.statusCode, errorMessage);
    } on HttpException catch (e) {
      debugPrint('API Exception: ${e.message} (Status: ${response.statusCode})');
      rethrow;
    } catch (e) {
      final errorMessage = _getDefaultErrorMessage(response.statusCode);
      debugPrint('API Exception: $e (Status: ${response.statusCode})');
      throw HttpException(response.statusCode, errorMessage);
    }
  }

  // Handle token expiration with dialog and redirect
  void _handleTokenExpired(String message) {
    if (_tokenDialogShown) return;
    _tokenDialogShown = true;

    Get.defaultDialog(
      title: 'Session Expired',
      barrierDismissible: false,
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 48),
          const SizedBox(height: 10),
          Text(message),
        ],
      ),
    );

    Future.delayed(const Duration(seconds: 3), () {
      _sessionController.clearSession();
      _tokenDialogShown = false;
      Get.offAllNamed('/login');
    });
  }

  // Generic HTTP request method for JSON-based requests
  Future<T> makeRequest<T>({
    required String url,
    required String method,
    Map<String, String>? headers,
    dynamic body,
    T Function(dynamic)? responseParser,
  }) async {
    final authToken = _sessionController.token.value;
    final defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $authToken',
    };

    // Merge default and custom headers
    final requestHeaders = {...defaultHeaders, ...?headers};

    try {
      final uri = Uri.parse(url);
      http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uri, headers: requestHeaders);
          break;
        case 'POST':
          response = await http.post(
            uri,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            uri,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: requestHeaders);
          break;
        default:
          throw HttpException(400, 'Unsupported HTTP method: $method');
      }

      return handleResponse<T>(response, parser: responseParser);
    } on TimeoutException {
      debugPrint("Timeout Exception: Request timed out");
      throw HttpException(408,
          '⏱️ Request timed out. Please check your connection and try again.');
    } on http.ClientException catch (e) {
      debugPrint("Client Exception: $e");
      throw HttpException(503,
          '🌐 Unable to reach the server. Please check your connection or try again later.');
    } on FormatException catch (e) {
      debugPrint("Format Exception: $e");
      throw HttpException(
          500, '⚠️ Invalid response format. Our team has been notified.');
    } on SocketException catch (e) {
      debugPrint("Socket Exception: $e");
      throw HttpException(503,
          '📶 Network connection issue. Please check your internet connection.');
    } catch (e) {
      debugPrint("Unhandled Error: $e");
      throw HttpException(
          500, '❗ An unexpected error occurred. Please try again later.');
    }
  }

  Future<T> makeMultipartRequest<T>({
    required String url,
    required String method,
    Map<String, String>? headers,
    required Map<String, String> fields,
    List<http.MultipartFile>? files,
    T Function(dynamic)? responseParser,
  }) async {
    final authToken = _sessionController.token.value;
    final defaultHeaders = {
      'Authorization': 'Bearer $authToken',
    };

    // Merge default and custom headers
    final requestHeaders = {...defaultHeaders, ...?headers};

    try {
      final uri = Uri.parse(url);
      var request = http.MultipartRequest(method, uri);

      // Add headers
      request.headers.addAll(requestHeaders);

      // Add form fields
      request.fields.addAll(fields);

      // Add files if provided
      if (files != null) {
        request.files.addAll(files);
      }

      // Send request
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return handleResponse<T>(response, parser: responseParser);
    } on TimeoutException {
      debugPrint("Timeout Exception: Multipart request timed out");
      throw HttpException(408,
          '⏱️ Request timed out. Please check your connection and try again.');
    } on http.ClientException catch (e) {
      debugPrint("Client Exception: $e");
      throw HttpException(503,
          '🌐 Unable to reach the server. Please check your connection or try again later.');
    } on SocketException catch (e) {
      debugPrint("Socket Exception: $e");
      throw HttpException(503,
          '📶 Network connection issue. Please check your internet connection.');
    } catch (e) {
      debugPrint("Unhandled Error: $e");
      throw HttpException(
          500, '❗ An unexpected error occurred. Please try again later.');
    }
  }
}
