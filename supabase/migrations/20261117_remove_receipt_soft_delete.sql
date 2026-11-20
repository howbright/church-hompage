-- 증빙파일을 논리 삭제하지 않고 실제 삭제하도록 전환합니다.
alter table church.claim_receipts
  drop column if exists deleted_at,
  drop column if exists deleted_by;

grant delete on church.claim_receipts to authenticated;
