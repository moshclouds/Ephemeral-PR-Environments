export class SendNotificationDto {
  recipient: string;
  message: string;
  channel?: string; // e.g., EMAIL, SMS, PUSH
}
