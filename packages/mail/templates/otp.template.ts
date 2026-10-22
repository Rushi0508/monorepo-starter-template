export type EmailOtpTemplatePayload = {
	otp: string;
};

export const emailOtpTemplate = ({ otp }: EmailOtpTemplatePayload) => `
<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Arial', sans-serif; color: #333;">
  <h2 style="text-align: center; color: #007bff;">One-Time Password (OTP)</h2>
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
    Use the OTP below to complete your login or verification process.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <div style="background-color: #e9ecef;
                padding: 15px 20px;
                border-radius: 5px;
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 5px;
                display: inline-block;">
      ${otp}
    </div>
  </div>
  <p style="font-size: 14px; color: #777; margin-top: 20px; text-align: center;">
    This OTP is valid for 10 minutes. Please do not share it with anyone.
  </p>
  <p style="font-size: 12px; color: #999; margin-top: 10px; text-align: center;">
    If you did not request this OTP, please ignore this email.
  </p>
</div>
`;
