import 'dart:io';
import 'package:aquapulse_app/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Added for FilteringTextInputFormatter
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:aquapulse_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:aquapulse_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';

class TaskDetailPage extends StatefulWidget {
  final Task task;

  const TaskDetailPage({super.key, required this.task});

  @override
  State<TaskDetailPage> createState() => _TaskDetailPageState();
}

class _TaskDetailPageState extends State<TaskDetailPage> {
  late String _selectedStatus;
  String _pendingReason = '';
  String _otp = '';
  File? _beforeImage;
  File? _afterImage;
  bool _isLoading = false;

  final TextEditingController _pendingReasonController =
      TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TechnicianController controller = Get.find<TechnicianController>();

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.task.taskStatus ?? 'Pending';
  }

  @override
  void dispose() {
    _pendingReasonController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(String type) async {
    final pickedFile =
        await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        if (type == 'before') {
          _beforeImage = File(pickedFile.path);
        } else {
          _afterImage = File(pickedFile.path);
        }
      });
    }
  }

  Future<void> _updateTask() async {
    if (_selectedStatus == 'Pending' && _pendingReason.trim().isEmpty) {
      CustomSnackbar.showError(message: 'Pending reason is required');
      return;
    }
    if (_selectedStatus == 'Completed' && _otp.trim().isEmpty) {
      CustomSnackbar.showError(message: 'OTP is required to mark as completed');
      return;
    }

    if (widget.task.taskId == null) {
      CustomSnackbar.showError(message: 'Task ID is missing');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await controller.updateTask(
        taskId: widget.task.taskId!,
        taskStatus: _selectedStatus,
        pendingReason: _selectedStatus == 'Pending' ? _pendingReason : null,
        otp: _selectedStatus == 'Completed' ? _otp : null,
        beforeImage: _beforeImage,
        afterImage: _afterImage,
      );
    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to update task: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Widget _buildInfoItem(String title, String? value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey)),
          const SizedBox(height: 4),
          Text(value ?? 'N/A',
              style:
                  const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildDropdown() {
    return DropdownButtonFormField<String>(
      value: _selectedStatus,
      dropdownColor: Colors.white,
      decoration: InputDecoration(
        filled: true,
        fillColor: Colors.grey.shade100,
        labelText: 'Select Status',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
      items: ['Pending', 'In Progress', 'Completed']
          .map((status) => DropdownMenuItem(value: status, child: Text(status)))
          .toList(),
      onChanged: (val) => setState(() {
        if (val != null) _selectedStatus = val;
      }),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    required Function(String) onChanged,
    List<TextInputFormatter>? inputFormatters, // Added for OTP restrictions
    int? maxLength,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      maxLength: maxLength,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.grey.shade100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
      onChanged: onChanged,
    );
  }

  Widget _buildImageUploadRow({
    required String label,
    required File? file,
    required VoidCallback onPressed,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 8),
        Row(
          children: [
            OutlinedButton.icon(
              onPressed: onPressed,
              icon: const Icon(Icons.image),
              label: const Text('Pick Image'),
            ),
            const SizedBox(width: 16),
            if (file != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child:
                    Image.file(file, width: 90, height: 90, fit: BoxFit.cover),
              ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildSubmitButton(dynamic theme) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        icon: const Icon(Icons.check_circle_outline),
        label: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2))
            : const Text('Update Task'),
        style: FilledButton.styleFrom(
          backgroundColor: theme.primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        onPressed: _isLoading ? null : _updateTask,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final task = widget.task;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: theme.primaryColor,
        title: const Text('Update Task'),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(task.taskDescription ?? "No description available",
                    style: theme.textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                _buildInfoItem(
                    'Assigned Date',
                    task.assignedDate != null
                        ? DateFormat('MMM dd, yyyy – hh:mm a')
                            .format(task.assignedDate!.toLocal())
                        : 'Not assigned'),
                _buildInfoItem("Customer's email", task.taskCreatedByUserEmail),
                if (task.wpDeviceId != null)
                  _buildInfoItem('WP Device ID', task.wpDeviceId),
                const SizedBox(height: 30),
                Text('Update Task Status',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                _buildDropdown(),
                if (_selectedStatus == 'Pending') ...[
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _pendingReasonController,
                    label: 'Pending Reason',
                    onChanged: (val) => _pendingReason = val,
                  ),
                ],
                if (_selectedStatus == 'Completed') ...[
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _otpController,
                    label: 'Enter OTP',
                    keyboardType: TextInputType.number,
                    onChanged: (val) => _otp = val,
                    inputFormatters: [
                      FilteringTextInputFormatter
                          .digitsOnly, // Allow only digits
                      LengthLimitingTextInputFormatter(
                          6), // Limit to 6 characters
                    ],
                    maxLength: 6, // Visual length limit with counter
                  ),
                ],
                const SizedBox(height: 24),
                _buildImageUploadRow(
                  label: 'Before Service Image',
                  file: _beforeImage,
                  onPressed: () => _pickImage('before'),
                ),
                _buildImageUploadRow(
                  label: 'After Service Image',
                  file: _afterImage,
                  onPressed: () => _pickImage('after'),
                ),
                const SizedBox(height: 36),
                _buildSubmitButton(theme),
              ],
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
