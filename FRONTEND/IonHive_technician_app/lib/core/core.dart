import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class Core {
  // Environment variable keys for base URLs
  static const String _prodBaseUrlKey = 'PROD_BASE_URL';
  static const String _devBaseUrlKey = 'DEV_BASE_URL';
  static const String _testingBaseUrlKey = 'TESTING_BASE_URL';

  // Dynamically select base URL
  static final String baseUrl = _getBaseUrl();

  // Private method to get base URL from .env
  static String _getBaseUrl() {
    String? url;
    if (kDebugMode) {
      url = dotenv.env[_testingBaseUrlKey];
      assert(url != null, 'TESTING_BASE_URL is missing in .env file');
    } else if (kProfileMode) {
      url = dotenv.env[_devBaseUrlKey];
      assert(url != null, 'DEV_BASE_URL is missing in .env file');
    } else if (kReleaseMode) {
      url = dotenv.env[_prodBaseUrlKey];
      assert(url != null, 'PROD_BASE_URL is missing in .env file');
    }
    // Fallback to a default URL if not found
    return url ?? dotenv.env[_prodBaseUrlKey] ?? 'http://localhost:3003';
  }

  // Helper method to get other .env variables
  static String? getEnvVariable(String key) {
    final value = dotenv.env[key];
    if (value == null) {
      debugPrint('Warning: Environment variable $key is missing');
    }
    return value;
  }
}





