import React from 'react';

import { FullTableList, useTableEntries } from './db-table-list';
import { CommonTitledLayout } from '../../layouts/page';

function TablesPage({ database_name }: { database_name: string }) {
  const tables = useTableEntries(database_name.toUpperCase());

  if (!Array.isArray(tables)) {
    return <div>loading</div>;
  }

  return (
    <CommonTitledLayout
      title="Tables in the cluster"
      // titleOptions={<CreateDatabaseModal />}
    >
      <FullTableList entries={tables} />
    </CommonTitledLayout>
  );
}

export { TablesPage };
