import { FieldMetadataType } from 'twenty-shared/types';

import { getRecordListSelectOptionValue } from '../utils/getRecordListSelectOptionValue';
import {
  type RecordListTemplateField,
  type RecordListTemplateKey,
} from './recordListTemplates';

const SELECT_COLORS = ['gray', 'blue', 'purple', 'orange', 'green', 'red'];

const createTextField = (
  name: string,
  label: string,
  icon = 'IconTextSize',
): RecordListTemplateField => ({
  name,
  label,
  type: FieldMetadataType.TEXT,
  icon,
});

const createDateField = (
  name: string,
  label: string,
): RecordListTemplateField => ({
  name,
  label,
  type: FieldMetadataType.DATE,
  icon: 'IconCalendarEvent',
});

const createSelectField = (
  name: string,
  label: string,
  optionLabels: string[],
  icon = 'IconList',
): RecordListTemplateField => {
  const optionValues: string[] = [];

  return {
    name,
    label,
    type: FieldMetadataType.SELECT,
    icon,
    options: optionLabels.map((optionLabel, position) => {
      const value = getRecordListSelectOptionValue(optionLabel, optionValues);

      optionValues.push(value);

      return {
        label: optionLabel,
        value,
        color: SELECT_COLORS[position % SELECT_COLORS.length],
      };
    }),
  };
};

const createStatusField = (optionLabels: string[]) =>
  createSelectField('status', 'Status', optionLabels, 'IconStatus');

const TEMPLATE_FIELDS: Record<
  RecordListTemplateKey,
  RecordListTemplateField[]
> = {
  OUTREACH_TRACKER: [
    createStatusField([
      'To research',
      'Ready to contact',
      'Contacted',
      'Follow-up',
      'Responded',
      'Completed',
      'Not relevant',
    ]),
    createSelectField(
      'channel',
      'Channel',
      ['Email', 'LinkedIn', 'Phone', 'Event', 'Introduction'],
      'IconSend',
    ),
    createSelectField(
      'priority',
      'Priority',
      ['Low', 'Medium', 'High'],
      'IconFlag',
    ),
    createDateField('lastContactedAt', 'Last contacted'),
    createDateField('nextFollowUpAt', 'Next follow-up'),
    createTextField('ownerNotes', 'Notes', 'IconNotes'),
  ],
  NEWSLETTER: [
    createStatusField([
      'Planned',
      'Preparing',
      'Ready',
      'Sent',
      'Responded',
      'Unsubscribed',
    ]),
    createSelectField(
      'newsletterType',
      'Newsletter type',
      ['Firm news', 'Portfolio news', 'Thought leadership', 'Event'],
      'IconMail',
    ),
    createSelectField(
      'audience',
      'Audience',
      ['Investors', 'Advisers', 'Founders', 'Media', 'Other'],
      'IconUsers',
    ),
    createDateField('plannedSendDate', 'Planned send date'),
    createDateField('sentAt', 'Sent at'),
    createTextField('campaignLink', 'Campaign link', 'IconLink'),
    createTextField('notes', 'Notes', 'IconNotes'),
  ],
  PRESS_OUTREACH: [
    createStatusField([
      'To research',
      'Pitch ready',
      'Contacted',
      'Follow-up',
      'Interested',
      'Published',
      'Passed',
    ]),
    createTextField('publication', 'Publication'),
    createTextField('campaignAngle', 'Campaign angle'),
    createSelectField(
      'outreachType',
      'Outreach type',
      [
        'Firm announcement',
        'Acquisition',
        'Exit',
        'Portfolio news',
        'Thought leadership',
      ],
      'IconSend',
    ),
    createDateField('pitchDate', 'Pitch date'),
    createDateField('followUpDate', 'Follow-up date'),
    createTextField('coverageLink', 'Coverage link', 'IconLink'),
    createTextField('notes', 'Notes', 'IconNotes'),
  ],
  MA_ADVISER_NEWSLETTER: [
    createStatusField([
      'To qualify',
      'Qualified',
      'Subscribed',
      'Contacted',
      'Responded',
      'Do not contact',
    ]),
    createSelectField(
      'adviserType',
      'Adviser type',
      [
        'Investment bank',
        'M&A boutique',
        'Corporate finance',
        'Debt adviser',
        'Other',
      ],
      'IconBuildingBank',
    ),
    createTextField('sectorFocus', 'Sector focus'),
    createTextField('geography', 'Geography'),
    createSelectField(
      'dealSize',
      'Typical deal size',
      ['Below €25m', '€25–50m', '€50–100m', 'Above €100m'],
      'IconCurrencyEuro',
    ),
    createDateField('lastNewsletterAt', 'Last newsletter'),
    createDateField('nextFollowUpAt', 'Next follow-up'),
    createTextField('notes', 'Notes', 'IconNotes'),
  ],
  RECRUITING: [
    createStatusField([
      'Sourced',
      'Screening',
      'Interviewing',
      'Offer',
      'Hired',
      'Rejected',
    ]),
    createTextField('role', 'Role'),
    createSelectField(
      'source',
      'Source',
      ['Referral', 'LinkedIn', 'Job board', 'Careers page', 'Other'],
      'IconTargetArrow',
    ),
    createSelectField(
      'interviewStage',
      'Stage',
      ['Screen', 'First round', 'Final round', 'References'],
      'IconFlag',
    ),
    createDateField('nextInterviewAt', 'Next interview'),
    createTextField('owner', 'Owner'),
    createTextField('notes', 'Notes', 'IconNotes'),
  ],
  OUTSOURCING: [
    createStatusField([
      'Researching',
      'Available',
      'Engaged',
      'On hold',
      'Inactive',
    ]),
    createTextField('skills', 'Skills'),
    createTextField('specialty', 'Specialty'),
    createTextField('hourlyRate', 'Hourly rate', 'IconCurrencyEuro'),
    createSelectField(
      'availability',
      'Availability',
      ['Available now', 'Within a month', 'Booked', 'Unknown'],
      'IconCalendarEvent',
    ),
    createTextField('lastProject', 'Last project'),
    createTextField('notes', 'Notes', 'IconNotes'),
  ],
  FUNDRAISING: [
    createStatusField([
      'To contact',
      'Intro requested',
      'Meeting scheduled',
      'Due diligence',
      'Committed',
      'Passed',
    ]),
    createTextField('investor', 'Investor', 'IconBuildingBank'),
    createSelectField(
      'round',
      'Round',
      ['Pre-seed', 'Seed', 'Series A', 'Series B+', 'Other'],
      'IconCoins',
    ),
    createSelectField(
      'stage',
      'Stage',
      ['Research', 'Warm intro', 'Pitch', 'Negotiation', 'Closed'],
      'IconFlag',
    ),
    createDateField('lastContactedAt', 'Last contacted'),
    createDateField('nextMeetingAt', 'Next meeting'),
    createTextField('amount', 'Amount', 'IconCurrencyEuro'),
    createTextField('notes', 'Notes', 'IconNotes'),
  ],
  VC_DEALFLOW: [
    createStatusField([
      'New',
      'Screening',
      'First meeting',
      'Due diligence',
      'Investment committee',
      'Invested',
      'Passed',
    ]),
    createSelectField(
      'dealStage',
      'Deal stage',
      ['Pre-seed', 'Seed', 'Series A', 'Series B+', 'Other'],
      'IconFlag',
    ),
    createTextField('sector', 'Sector'),
    createTextField('source', 'Source'),
    createSelectField(
      'priority',
      'Priority',
      ['Low', 'Medium', 'High'],
      'IconFlag',
    ),
    createDateField('lastReviewedAt', 'Last reviewed'),
    createTextField('nextStep', 'Next step'),
  ],
  EMPLOYEE_ONBOARDING: [
    createStatusField([
      'Offer accepted',
      'Before day one',
      'Week one',
      'First month',
      'Complete',
    ]),
    createTextField('role', 'Role'),
    createDateField('startDate', 'Start date'),
    createTextField('manager', 'Manager'),
    createSelectField(
      'equipment',
      'Equipment',
      ['Not requested', 'Requested', 'Ready', 'Delivered'],
      'IconDeviceLaptop',
    ),
    createSelectField(
      'training',
      'Training',
      ['Not started', 'In progress', 'Complete'],
      'IconBook',
    ),
    createDateField('nextCheckInAt', 'Next check-in'),
  ],
};

export const getEditableRecordListTemplateFields = (
  templateKey: RecordListTemplateKey,
  localizedLabels?: string[],
): RecordListTemplateField[] =>
  TEMPLATE_FIELDS[templateKey].map((field, index) => ({
    ...field,
    label: localizedLabels?.[index] ?? field.label,
    options: field.options?.map((option) => ({ ...option })),
  }));

export const getDefaultEditableRecordListFields = () => [
  createStatusField(['New', 'In progress', 'Done']),
];
