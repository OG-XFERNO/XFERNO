import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Brevo list IDs under folder xferno-app
const BREVO_LISTS = {
  EMAIL_NOTIFICATIONS: 4,
  PRICE_ALERTS: 5,
  MARKETING_EMAILS: 6,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly brevoApiKey: string;
  private readonly brevoApiUrl = 'https://api.brevo.com/v3';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY') || '';
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        notificationPrefs: true,
      },
    });

    if (!user) {
      return {
        emailNotifications: false,
        priceAlerts: false,
        marketingEmails: false,
        browserNotifications: false,
      };
    }

    // Parse stored preferences or return defaults
    const prefs = (user.notificationPrefs as any) || {};
    return {
      emailNotifications: prefs.emailNotifications ?? false,
      priceAlerts: prefs.priceAlerts ?? false,
      marketingEmails: prefs.marketingEmails ?? false,
      browserNotifications: prefs.browserNotifications ?? false,
    };
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<{
      emailNotifications: boolean;
      priceAlerts: boolean;
      marketingEmails: boolean;
      browserNotifications: boolean;
    }>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, notificationPrefs: true },
    });

    if (!user || !user.email) {
      throw new Error('User not found or no email');
    }

    // Get current preferences
    const currentPrefs = (user.notificationPrefs as any) || {};
    const newPrefs = { ...currentPrefs, ...updates };

    // Update in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPrefs: newPrefs },
    });

    // Sync with Brevo lists
    await this.syncBrevoLists(user.email, updates);

    return newPrefs;
  }

  /**
   * Sync email subscription status with Brevo lists
   */
  private async syncBrevoLists(
    email: string,
    updates: Partial<{
      emailNotifications: boolean;
      priceAlerts: boolean;
      marketingEmails: boolean;
    }>,
  ) {
    if (!this.brevoApiKey) {
      this.logger.warn('Brevo API key not configured, skipping list sync');
      return;
    }

    try {
      const listUpdates: { listId: number; subscribe: boolean }[] = [];

      if ('emailNotifications' in updates) {
        listUpdates.push({
          listId: BREVO_LISTS.EMAIL_NOTIFICATIONS,
          subscribe: updates.emailNotifications!,
        });
      }

      if ('priceAlerts' in updates) {
        listUpdates.push({
          listId: BREVO_LISTS.PRICE_ALERTS,
          subscribe: updates.priceAlerts!,
        });
      }

      if ('marketingEmails' in updates) {
        listUpdates.push({
          listId: BREVO_LISTS.MARKETING_EMAILS,
          subscribe: updates.marketingEmails!,
        });
      }

      for (const update of listUpdates) {
        if (update.subscribe) {
          await this.addToBrevoList(email, update.listId);
        } else {
          await this.removeFromBrevoList(email, update.listId);
        }
      }
    } catch (error) {
      this.logger.error('Failed to sync Brevo lists:', error);
      // Don't throw - we still want to save preferences locally
    }
  }

  /**
   * Add email to a Brevo list
   */
  private async addToBrevoList(email: string, listId: number) {
    try {
      // First, ensure contact exists
      await fetch(`${this.brevoApiUrl}/contacts`, {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          listIds: [listId],
          updateEnabled: true,
        }),
      });

      this.logger.log(`Added ${email} to Brevo list ${listId}`);
    } catch (error) {
      this.logger.error(`Failed to add ${email} to list ${listId}:`, error);
    }
  }

  /**
   * Remove email from a Brevo list
   */
  private async removeFromBrevoList(email: string, listId: number) {
    try {
      await fetch(`${this.brevoApiUrl}/contacts/lists/${listId}/contacts/remove`, {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [email],
        }),
      });

      this.logger.log(`Removed ${email} from Brevo list ${listId}`);
    } catch (error) {
      this.logger.error(`Failed to remove ${email} from list ${listId}:`, error);
    }
  }
}
