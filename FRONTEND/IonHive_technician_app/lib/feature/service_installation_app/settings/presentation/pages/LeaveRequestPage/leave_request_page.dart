import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/domain/repositories/settings_repository.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/domain/models/leave_request_model.dart';

class LeaveRequestPage extends StatefulWidget {
  const LeaveRequestPage({super.key});

  @override
  State<LeaveRequestPage> createState() => _LeaveRequestPageState();
}

class _LeaveRequestPageState extends State<LeaveRequestPage> {
  late SettingsRepository _repository;
  final SessionController _sessionController = Get.find<SessionController>();

  int _selectedTab = 0;
  List<LeaveRequest> _leaveRequests = [];
  bool _isLoadingRequests = false;
  Set<int> _expandedReasons = {};

  final TextEditingController _reasonController = TextEditingController();
  DateTime? _fromDate;
  DateTime? _toDate;
  bool _isLoadingSubmit = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = SettingsRepository();
    _fetchLeaveRequests();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _fetchLeaveRequests() async {
    setState(() {
      _isLoadingRequests = true;
    });

    try {
      final technicianId = _sessionController.technicianId.value;
      final email = _sessionController.emailId.value;

      final response = await _repository.getTechnicianLeaveRequests(
        technicianId: technicianId,
        email: email,
      );

      if (!response.error) {
        setState(() {
          _leaveRequests = response.data ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching leave requests: $e');
    } finally {
      setState(() {
        _isLoadingRequests = false;
      });
    }
  }

  int _calculateNumberOfDays() {
    if (_fromDate != null && _toDate != null) {
      return _toDate!.difference(_fromDate!).inDays + 1;
    }
    return 0;
  }

  Future<void> _selectFromDate() async {
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: _fromDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            dialogBackgroundColor: Colors.white,
            scaffoldBackgroundColor: Colors.white,
            textTheme: Theme.of(context).textTheme.copyWith(
              headlineSmall: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              headlineMedium: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
              headlineLarge: const TextStyle(fontSize: 20, fontWeight: FontWeight.w500),
            ),
          ),
          child: Dialog(
            backgroundColor: Colors.white,
            elevation: 8,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: SizedBox(
              width: MediaQuery.of(context).size.width * 0.9,
              height: MediaQuery.of(context).size.height * 0.65,
              child: child!,
            ),
          ),
        );
      },
    );
    if (pickedDate != null) {
      setState(() {
        _fromDate = pickedDate;
        if (_toDate != null && _toDate!.isBefore(_fromDate!)) {
          _toDate = null;
        }
      });
    }
  }

  Future<void> _selectToDate() async {
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: _toDate ?? (_fromDate ?? DateTime.now()),
      firstDate: _fromDate ?? DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            dialogBackgroundColor: Colors.white,
            scaffoldBackgroundColor: Colors.white,
            textTheme: Theme.of(context).textTheme.copyWith(
              headlineSmall: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              headlineMedium: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
              headlineLarge: const TextStyle(fontSize: 20, fontWeight: FontWeight.w500),
            ),
          ),
          child: Dialog(
            backgroundColor: Colors.white,
            elevation: 8,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: SizedBox(
              width: MediaQuery.of(context).size.width * 0.9,
              height: MediaQuery.of(context).size.height * 0.65,
              child: child!,
            ),
          ),
        );
      },
    );
    if (pickedDate != null) {
      setState(() {
        _toDate = pickedDate;
      });
    }
  }

  Future<void> _submitLeaveRequest() async {
    if (_fromDate == null || _toDate == null || _reasonController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please fill all fields';
      });
      return;
    }

    setState(() {
      _isLoadingSubmit = true;
      _errorMessage = null;
    });

    try {
      final technicianId = _sessionController.technicianId.value;

      final email = _sessionController.emailId.value;
      final fromDateStr = '${_fromDate!.year}-${_fromDate!.month.toString().padLeft(2, '0')}-${_fromDate!.day.toString().padLeft(2, '0')}';
      final toDateStr = '${_toDate!.year}-${_toDate!.month.toString().padLeft(2, '0')}-${_toDate!.day.toString().padLeft(2, '0')}';
      final numberOfDays = _calculateNumberOfDays();

      final response = await _repository.requestLeave(
        technicianId: technicianId,
        email: email,
        fromDate: fromDateStr,
        toDate: toDateStr,
        numberOfDays: numberOfDays,
        reason: _reasonController.text,
      );

      setState(() {
        _isLoadingSubmit = false;
      });

      if (!response.error) {
        Get.snackbar(
          'Success',
          response.message ?? 'Leave request submitted successfully',
          backgroundColor: Colors.blue[500],
          colorText: Colors.white,
          duration: const Duration(seconds: 2),
        );
        _resetForm();
        Future.delayed(const Duration(seconds: 1), () {
          _fetchLeaveRequests();
          setState(() {
            _selectedTab = 0;
          });
        });
      } else {
        setState(() {
          _errorMessage = response.message ?? 'Failed to submit leave request';
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingSubmit = false;
        _errorMessage = 'Error: ${e.toString()}';
      });
    }
  }

  void _resetForm() {
    setState(() {
      _reasonController.clear();
      _fromDate = null;
      _toDate = null;
      _errorMessage = null;
    });
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'requested':
      default:
        return Colors.amber;
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leave Requests'),
        backgroundColor: Colors.blue[500],
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Get.back(),
        ),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.02),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selectedTab = 0);
                      _resetForm();
                    },
                    child: Container(
                      padding: EdgeInsets.symmetric(vertical: screenHeight * 0.015),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _selectedTab == 0
                                ? Colors.blue[500]!
                                : Colors.transparent,
                            width: 3,
                          ),
                        ),
                      ),
                      child: Text(
                        'View Requests',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: _selectedTab == 0
                              ? Colors.blue[500]
                              : Colors.grey[600],
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selectedTab = 1);
                      _resetForm();
                    },
                    child: Container(
                      padding: EdgeInsets.symmetric(vertical: screenHeight * 0.015),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _selectedTab == 1
                                ? Colors.blue[500]!
                                : Colors.transparent,
                            width: 3,
                          ),
                        ),
                      ),
                      child: Text(
                        'New Request',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: _selectedTab == 1
                              ? Colors.blue[500]
                              : Colors.grey[600],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _selectedTab == 0 ? _buildViewRequests(context, screenWidth, screenHeight) : _buildNewRequest(context, screenWidth, screenHeight),
          ),
        ],
      ),
    );
  }

  Widget _buildViewRequests(BuildContext context, double screenWidth, double screenHeight) {
    if (_isLoadingRequests) {
      return Center(
        child: CircularProgressIndicator(color: Colors.blue[500]),
      );
    }

    if (_leaveRequests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calendar_today,
              size: 64,
              color: Colors.grey[300],
            ),
            SizedBox(height: screenHeight * 0.02),
            Text(
              'No leave requests yet',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(screenWidth * 0.04),
      itemCount: _leaveRequests.length,
      itemBuilder: (context, index) {
        final leave = _leaveRequests[index];
        final statusColor = _getStatusColor(leave.status);

        return Container(
          margin: EdgeInsets.only(bottom: screenHeight * 0.02),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.all(screenWidth * 0.04),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${leave.fromDate.day}/${leave.fromDate.month}/${leave.fromDate.year} - ${leave.toDate.day}/${leave.toDate.month}/${leave.toDate.year}',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[800],
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.008),
                          Text(
                            '${leave.numberOfDays} day${leave.numberOfDays > 1 ? 's' : ''}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: screenWidth * 0.03,
                        vertical: screenHeight * 0.008,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        leave.status,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: screenHeight * 0.015),
                Container(
                  height: 1,
                  color: Colors.grey[200],
                ),
                SizedBox(height: screenHeight * 0.015),
                Text(
                  'Requested on: ${leave.requestedDate.day}/${leave.requestedDate.month}/${leave.requestedDate.year}',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
                ),
                if (leave.reason != null && leave.reason!.isNotEmpty) ...[
                  SizedBox(height: screenHeight * 0.01),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Reason: ${leave.reason}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[700],
                        ),
                        maxLines: _expandedReasons.contains(index) ? null : 2,
                        overflow: _expandedReasons.contains(index)
                            ? TextOverflow.visible
                            : TextOverflow.ellipsis,
                      ),
                      if (leave.reason!.length > 80 &&
                          !_expandedReasons.contains(index))
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _expandedReasons.add(index);
                            });
                          },
                          child: Text(
                            'View More',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue[500],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      else if (_expandedReasons.contains(index))
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _expandedReasons.remove(index);
                            });
                          },
                          child: Text(
                            'View Less',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue[500],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
                if (leave.approvalDate != null) ...[
                  SizedBox(height: screenHeight * 0.01),
                  Text(
                    'Approved on: ${leave.approvalDate!.day}/${leave.approvalDate!.month}/${leave.approvalDate!.year}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
                if (leave.rejectionReason != null && leave.rejectionReason!.isNotEmpty) ...[
                  SizedBox(height: screenHeight * 0.01),
                  Text(
                    'Rejection Reason: ${leave.rejectionReason}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.red[700],
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildNewRequest(BuildContext context, double screenWidth, double screenHeight) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.all(screenWidth * 0.04),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_errorMessage != null)
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(screenWidth * 0.03),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  border: Border.all(color: Colors.red[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _errorMessage!,
                  style: TextStyle(
                    color: Colors.red[700],
                    fontSize: 13,
                  ),
                ),
              ),
            if (_errorMessage != null) SizedBox(height: screenHeight * 0.02),
            Text(
              'From Date',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            SizedBox(height: screenHeight * 0.008),
            GestureDetector(
              onTap: _selectFromDate,
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.03,
                  vertical: screenHeight * 0.015,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                  color: Colors.white,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _fromDate != null
                          ? '${_fromDate!.day}/${_fromDate!.month}/${_fromDate!.year}'
                          : 'Select date',
                      style: TextStyle(
                        fontSize: 14,
                        color: _fromDate != null
                            ? Colors.grey[800]
                            : Colors.grey[500],
                      ),
                    ),
                    Icon(
                      Icons.calendar_today,
                      color: Colors.blue[500],
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: screenHeight * 0.02),
            Text(
              'To Date',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            SizedBox(height: screenHeight * 0.008),
            GestureDetector(
              onTap: _fromDate != null ? _selectToDate : null,
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.03,
                  vertical: screenHeight * 0.015,
                ),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: _fromDate != null
                        ? Colors.grey[300]!
                        : Colors.grey[200]!,
                  ),
                  borderRadius: BorderRadius.circular(8),
                  color: _fromDate != null ? Colors.white : Colors.grey[50],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _toDate != null
                          ? '${_toDate!.day}/${_toDate!.month}/${_toDate!.year}'
                          : 'Select date',
                      style: TextStyle(
                        fontSize: 14,
                        color: _toDate != null
                            ? Colors.grey[800]
                            : Colors.grey[500],
                      ),
                    ),
                    Icon(
                      Icons.calendar_today,
                      color: Colors.blue[500],
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
            if (_fromDate != null && _toDate != null)
              Padding(
                padding: EdgeInsets.only(top: screenHeight * 0.01),
                child: Text(
                  'Number of days: ${_calculateNumberOfDays()}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.green[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            SizedBox(height: screenHeight * 0.02),
            Text(
              'Reason for Leave',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            SizedBox(height: screenHeight * 0.008),
            TextField(
              controller: _reasonController,
              maxLines: 4,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: 'Enter reason for leave',
                hintStyle: TextStyle(color: Colors.grey[400]),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.blue[500]!, width: 1.5),
                ),
                contentPadding: EdgeInsets.all(screenWidth * 0.03),
              ),
              style: TextStyle(fontSize: 14, color: Colors.grey[800]),
            ),
            SizedBox(height: screenHeight * 0.03),
            SizedBox(
              width: double.infinity,
              height: screenHeight * 0.06, // ✅ slightly more height
              child: ElevatedButton(
                onPressed: _isLoadingSubmit ? null : _submitLeaveRequest,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue, // ✅ ensures proper color
                  disabledBackgroundColor: Colors.blue.shade200,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 2,
                  padding: EdgeInsets.zero, // ✅ remove padding to prevent overflow
                ),
                child: _isLoadingSubmit
                    ? const SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
                    : const Center( // ✅ ensures text is centered
                  child: Text(
                    'Submit Leave Request',
                    style: TextStyle(
                      fontSize: 13, // ✅ more readable
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),

          ],
        ),
      ),
    );
  }
}
