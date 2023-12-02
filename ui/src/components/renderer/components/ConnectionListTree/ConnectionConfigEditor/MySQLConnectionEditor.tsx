import { ConnectionStoreConfig } from 'drivers/base/SQLLikeConnection';
import RelationalDbConnectionEditor from './RelationalDbConnectionEditor';
import Stack from 'renderer/components/Stack';

export default function MySQLConnectionEditor({
  config,
  onChange,
}: {
  config: ConnectionStoreConfig;
  onChange: (value: ConnectionStoreConfig) => void;
}) {
  return (
    <Stack vertical>
      <RelationalDbConnectionEditor config={config} onChange={onChange} />
    </Stack>
  );
}
