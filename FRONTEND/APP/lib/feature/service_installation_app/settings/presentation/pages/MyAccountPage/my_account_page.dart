// feature/technician_app/settings/presentation/pages/edit_account_page.dart
import 'package:aquapulse_app/feature/service_installation_app/settings/presentation/controllers/settings_controller.dart';
import 'package:aquapulse_app/utils/widgets/button/custom_button.dart';
import 'package:aquapulse_app/utils/widgets/error/error_display_widget.dart';
import 'package:aquapulse_app/utils/widgets/input_field/city_input_fields.dart';
import 'package:aquapulse_app/utils/widgets/input_field/phonenumber_inputfield.dart';
import 'package:aquapulse_app/utils/widgets/input_field/username_input_fields.dart';
import 'package:aquapulse_app/utils/widgets/loading/linear_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class EditAccountPage extends StatelessWidget {
  const EditAccountPage({super.key});

  @override
  Widget build(BuildContext context) {
    final TechnicianSettingsController controller =
        Get.find<TechnicianSettingsController>();
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    final formattedDate = DateFormat('MMMM dd, yyyy').format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Account',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 20,
            color: Colors.white,
            letterSpacing: 1.5,
          ),
        ),
        backgroundColor: Colors.transparent,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.primary,
                theme.colorScheme.primary.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Get.back(),
        ),
      ),
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Obx(
        () {
          if (controller.isRefreshing.value) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32.0),
                child: LinearLoadingIndicator(
                  color: theme.colorScheme.primary,
                  height: 4.0,
                  widthFactor: 0.3,
                ),
              ),
            );
          } else if (controller.errorMessage.value.isNotEmpty) {
            return ErrorDisplayWidget(
              errorMessage: controller.errorMessage.value,
              onRetry: () => controller.fetchTechnicianDetails(),
            );
          } else if (controller.technicianData.value == null) {
            return Center(
              child: Text(
                'No user data available',
                style: TextStyle(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                  fontSize: screenWidth * 0.04,
                ),
              ),
            );
          }

          return SingleChildScrollView(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 16.0,
            ),
            child: Column(
              children: [
                Stack(
                  children: [
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            theme.colorScheme.primary,
                            theme.colorScheme.primary.withOpacity(0.8),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 20,
                      left: 100,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: CircleAvatar(
                              radius: 50,
                              backgroundColor:
                                  theme.colorScheme.primary.withOpacity(0.1),
                              child: Icon(
                                Icons.person,
                                size: 70,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.01),
                          Text(
                            controller.technicianData.value?.name ??
                                'Technician',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: screenWidth * 0.045,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Last updated: $formattedDate',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: screenWidth * 0.035,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: screenHeight * 0.02),
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: screenWidth * 0.04,
                    vertical: screenHeight * 0.02,
                  ),
                  child: Form(
                    key: controller.formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Edit Your Profile',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: screenWidth * 0.05,
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        UsernameInput(
                          controller: controller.editNameController,
                          onChanged: (value) => controller.validateForm(),
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        CityInput(
                          controller: controller.editCityController,
                          onChanged: (value) => controller.validateForm(),
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        PhoneNumberInput(
                          controller: controller.editPhoneController,
                          onChanged: (value) => controller.validateForm(),
                          onSubmitted: (_) => FocusScope.of(context).unfocus(),
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        TextField(
                          decoration: InputDecoration(
                            labelText: "Email",
                            labelStyle: theme.textTheme.bodyMedium,
                            filled: true,
                            fillColor:
                                theme.colorScheme.primary.withOpacity(0.1),
                            enabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color:
                                    theme.colorScheme.primary.withOpacity(0.6),
                                width: 2.0,
                              ),
                            ),
                            disabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color:
                                    theme.colorScheme.primary.withOpacity(0.2),
                                width: 2.0,
                              ),
                            ),
                          ),
                          controller: TextEditingController(
                            text:
                                controller.technicianData.value?.email ?? 'N/A',
                          ),
                          enabled: false,
                          style: TextStyle(
                            fontSize: screenWidth * 0.04,
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "LOCATION",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: screenWidth * 0.04,
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                            Text(
                              "India",
                              style: TextStyle(
                                fontSize: screenWidth * 0.04,
                                color: theme.colorScheme.onSurface
                                    .withOpacity(0.6),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: screenHeight * 0.04),
                        Center(
                          child: Obx(() {
                            return CustomButton(
                              text: "Save Changes",
                              isLoading: controller.isEditLoading.value,
                              onPressed: controller.isFormValid.value &&
                                      !controller.isEditLoading.value
                                  ? () async {
                                      final phoneNumberString = controller
                                          .editPhoneController.text
                                          .trim();
                                      final phoneNumber =
                                          int.tryParse(phoneNumberString);
                                      if (phoneNumber == null) {
                                        controller.phoneError.value =
                                            'Invalid phone number';
                                        return;
                                      }
                                      await controller.updateTechnicianDetails(
                                        name: controller.editNameController.text
                                            .trim(),
                                        phone: phoneNumber,
                                        city: controller.editCityController.text
                                            .trim(),
                                      );
                                      Get.back();
                                    }
                                  : () {},
                              borderRadius: 12.0,
                              padding: EdgeInsets.symmetric(
                                horizontal: screenWidth * 0.1,
                                vertical: screenWidth * 0.04,
                              ),
                              gradient: LinearGradient(
                                colors: controller.isFormValid.value &&
                                        !controller.isEditLoading.value
                                    ? [
                                        theme.colorScheme.primary,
                                        theme.colorScheme.primary
                                            .withOpacity(0.8),
                                      ]
                                    : [
                                        Colors.grey.shade400,
                                        Colors.grey.shade500,
                                      ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              textStyle: TextStyle(
                                fontSize: screenWidth * 0.04,
                                fontWeight: FontWeight.w600,
                              ),
                            );
                          }),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
