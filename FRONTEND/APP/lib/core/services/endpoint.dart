class Endpoint {
  final String url;
  final String method;
  final Map<String, dynamic>? defaultBody; // optional
  const Endpoint({
    required this.url,
    required this.method,
    this.defaultBody,
  });
}
