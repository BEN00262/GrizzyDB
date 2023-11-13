// used to display tables
import Grid from "@mui/material/Grid";
import TableRowsIcon from "@mui/icons-material/TableRows";
import CloseIcon from "@mui/icons-material/Close";

const Table = ({ name }: { name: string }) => {
  return (
    <div
      style={{
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "16px",
        display: "flex",
        gap: 2,
        alignItems: "flex-end",
      }}
    >
      <TableRowsIcon />
      {name}
    </div>
  );
};

const TableView = () => {
  return null;
};

const Tab = () => {
  return (
    <div
      style={{
        width: "150px",
        border: "1px solid #efefef",
        borderBottom: "transparent",
        height: "40px",
        borderRadius: "16px 16px 0px 0px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0px 10px",
        fontSize: "16px",
        fontWeight: "bold",
      }}
    >
      <div>users</div>
      <div>
        <CloseIcon
          style={{
            cursor: "pointer",
            fontSize: "16px",
          }}
        />
      </div>
    </div>
  );
};

// use provider to handle this view

const TablesView = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={2}>
        <div
          style={{
            borderRight: "1px solid #efefef",
            height: "75vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginTop: "35px",
          }}
        >
          <Table name="users" />
          <Table name="products" />
        </div>
      </Grid>
      <Grid item xs={6} md={8}>
        {/* tabs for the different pages */}
        <div
          style={{
            borderBottom: "1px solid #efefef",
            overflowX: "auto",
            overflowY: "hidden",
            display: "flex",
            gap: 1
          }}
        >
          {/* tabs */}
          <Tab />
          <Tab />
        </div>

        <div>
          <TableView />
        </div>
      </Grid>
    </Grid>
  );
};

export default TablesView;
