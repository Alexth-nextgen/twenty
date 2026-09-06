import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { STANDARD_ERROR_MESSAGE } from 'src/engine/api/common/common-query-runners/errors/standard-error-message.constant';
import { CustomException } from 'src/utils/custom-exception';

export const RecordListExceptionCode = {
  RECORD_LIST_NOT_FOUND: 'RECORD_LIST_NOT_FOUND',
  RECORD_LIST_ENTRY_NOT_FOUND: 'RECORD_LIST_ENTRY_NOT_FOUND',
  SOURCE_RECORD_NOT_FOUND: 'SOURCE_RECORD_NOT_FOUND',
  PARENT_OBJECT_NOT_FOUND: 'PARENT_OBJECT_NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

type RecordListExceptionCode =
  (typeof RecordListExceptionCode)[keyof typeof RecordListExceptionCode];

const getRecordListExceptionUserFriendlyMessage = (
  code: RecordListExceptionCode,
) => {
  switch (code) {
    case RecordListExceptionCode.RECORD_LIST_NOT_FOUND:
      return msg`List not found.`;
    case RecordListExceptionCode.RECORD_LIST_ENTRY_NOT_FOUND:
      return msg`List entry not found.`;
    case RecordListExceptionCode.SOURCE_RECORD_NOT_FOUND:
      return msg`The selected record could not be found.`;
    case RecordListExceptionCode.PARENT_OBJECT_NOT_FOUND:
      return msg`The selected object could not be found.`;
    case RecordListExceptionCode.INTERNAL_SERVER_ERROR:
      return STANDARD_ERROR_MESSAGE;
    default:
      assertUnreachable(code);
  }
};

export class RecordListException extends CustomException<RecordListExceptionCode> {
  constructor(message: string, code: RecordListExceptionCode) {
    super(message, code, {
      userFriendlyMessage: getRecordListExceptionUserFriendlyMessage(code),
    });
  }
}
