import React, { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  Card,
  // Typography,
  Box,
  CircularProgress
} from '@material-ui/core';
import { capitalize } from 'lodash';
import { makeStyles } from '@material-ui/core/styles';
import Scrollbar from '../../../components/Scrollbar';
import { PATH_DASHBOARD } from '../../../routes/paths';
import { ModelListRow } from '../../../@types/model';
import ModelListToolbar from './ModelListToolbar';
import { usePaginatedModels } from '../../../api/models/GetModels';
import { formattedDate } from '../../../utils/date';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import { colors } from '../../../theme/colors';
import { DialogAnimate } from '../../../components/animate';
import { display } from '@material-ui/system';
import { log } from 'console';

interface ModelColumn {
  id: 'name' | 'date' | 'action' | 'alert';
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: number) => string;
  span: number;
}
interface subModelColumn {
  id:
    | 'submodel'
    | 'subcreated'
    | 'totalPrediction'
    | 'lastPrediction'
    | 'performance'
    | 'behavior'
    | 'integrity';
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: number) => string;
  subSpan: number;
}

const MODEL_COLUMNS: ModelColumn[] = [
  { id: 'action', label: 'Actions', minWidth: 50, align: 'center', span: 2 },
  { id: 'alert', label: 'Alerts', minWidth: 50, align: 'center', span: 3 }
];
const sub_MODEL_COLUMNS: subModelColumn[] = [
  { id: 'submodel', label: '', minWidth: 50, subSpan: 1, align: 'center' },
  { id: 'subcreated', label: '', minWidth: 50, subSpan: 1 },
  { id: 'totalPrediction', label: 'Total prediction', minWidth: 50, subSpan: 1, align: 'center' },
  { id: 'lastPrediction', label: 'Last Prediction', minWidth: 50, subSpan: 1, align: 'center' },
  { id: 'performance', label: 'Model Performance', minWidth: 50, subSpan: 1, align: 'center' },
  { id: 'behavior', label: 'Data Behavior', minWidth: 50, subSpan: 1, align: 'center' },
  { id: 'integrity', label: 'Data Integrity', minWidth: 50, subSpan: 1, align: 'center' }
];
const useStyles = makeStyles(() => ({
  card: {
    backgroundColor: colors.white,
    borderRadius: '10px',
    marginBottom: '20px'
  },
  tableContainer: {
    width: '100%',
    overflowX: 'hidden'
  },
  table: {
    width: '100%',
    margin: 0
  },
  tableHeading: {
    width: '100%'
  },
  tableHead: {
    root: {
      backgroundColor: colors.black
    },
    opacity: 1,
    height: 40,
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '22px'
  },
  tableHeadCell: {
    root: {
      backgroundColor: colors.black
    },
    backgroundColor: colors.tableHeadBack,
    height: 40,
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.text
  },
  subModel: {
    height: 40,
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderRightColor: colors.tableHeadBack,
    borderBottomColor: colors.tableHeadBack,
    backgroundColor: colors.white,
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: '12px',
    lineHeight: '22px',
    color: colors.text,
    '&:last-child': {
      borderRight: 0
    }
  },
  tableRow: {
    cursor: 'pointer',
    hover: {
      backgroundColor: colors.navActive,
      opacity: 0.1,
      boxShadow: '0px 4px 10px rgba(103, 128, 220, 0.1)'
    }
  },
  tableCell: {
    height: 40,
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: colors.tableHeadBack,
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.text,
    '&:last-child': {
      borderRight: 0
    }
  },
  pagination: {
    fontFamily: 'Public Sans',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '22px',
    color: colors.text
  },
  createVersionDialogue: {
    padding: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  createDialogueHeading: {
    fontSize: '1.2rem',
    fontWeight: 500,
    color: colors.text
  }
}));

interface SortProps {
  name: 'asc' | 'desc' | undefined;
  created: 'asc' | 'desc' | undefined;
}
const ModelListTable = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchName, setSearchName] = useState('');
  const [columnName, setColumnName] = useState('name');
  const [expandForm, setExpandForm] = useState(false);
  const [orderDirection, setOrderDirection] = useState<SortProps>({ name: 'asc', created: 'asc' });

  const { data, isLoading } = usePaginatedModels({
    query: searchName,
    page: page + 1,
    limit: rowsPerPage,
    sort:
      columnName === 'name'
        ? orderDirection.name === 'asc'
          ? 'name_asc'
          : 'name_desc'
        : orderDirection.created === 'asc'
        ? 'created_at_asc'
        : 'created_at_desc'
  });
  // const modelList = data?.modelList || [];
  // const meta = data?.meta || { page: 0, total: 0, limit: 10, sort: 'name_asc' };

  const [items, setItems] = useState<any>([]);
  const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetch(
      `${BASE_URL}/v1/list.models?query=${searchName}&page=${page + 1}&limit=${rowsPerPage}&sort=${
        columnName === 'name'
          ? orderDirection.name === 'asc'
            ? 'name_asc'
            : 'name_desc'
          : orderDirection.created === 'asc'
          ? 'created_at_asc'
          : 'created_at_desc'
      }`
    )
      .then((res) => res.json())
      .then((result) => {
        setItems(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [ignored]);
  console.log(items);
  const ItemLists = items?.model_list || [];
  const meta = items?.meta || { page: 0, total: 0, limit: 10, sort: 'name_asc' };

  const classes = useStyles();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const dat = new Date();
  console.log(dat);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(page);
  };

  const handleClick = (modelId: string, versionId: string) => {
    if (versionId != null) {
      navigate(`${PATH_DASHBOARD.general.models}/${modelId}/overview?version_id=${versionId}`);
      // navigate(
      //   {
      //   pathname:`${PATH_DASHBOARD.general.models}/${modelId}/overview`,
      //   search: `versionId:${versionId}`
      // }
      //   );
    } else {
      setExpandForm((state) => !state);
    }
  };

  const handleFilterByName = (searchName: string) => {
    setSearchName(searchName);
  };

  const handleSortRequest = (data: string) => {
    setColumnName(data);
    data === 'name'
      ? orderDirection.name === 'asc'
        ? setOrderDirection({ name: 'desc', created: orderDirection.created })
        : setOrderDirection({ name: 'asc', created: orderDirection.created })
      : orderDirection.created === 'asc'
      ? setOrderDirection({ name: orderDirection.name, created: 'desc' })
      : setOrderDirection({ name: orderDirection.name, created: 'asc' });
  };

  const DialogBox = () => {
    const classes = useStyles();
    const [boxDisplay, setBoxDisplay] = useState(true);

    return (
      <>
        {boxDisplay === true ? (
          <Box className={classes.createVersionDialogue}>
            <div className={classes.createDialogueHeading}> Create version Id</div>
          </Box>
        ) : null}
      </>
    );
  };

  return (
    <>
      <ModelListToolbar
        searchName={searchName}
        onSearch={handleFilterByName}
        forceUpdate={forceUpdate}
      />
      <Card className={classes.card}>
        <Scrollbar>
          <TableContainer className={classes.tableContainer}>
            <Table className={classes.table}>
              <TableHead className={classes.tableHeading}>
                <TableRow className={classes.tableHead}>
                  <TableCell
                    key="name"
                    align="center"
                    className={classes.tableHeadCell}
                    onClick={() => handleSortRequest('name')}
                  >
                    <TableSortLabel active={true} direction={orderDirection.name}>
                      Model name&nbsp;
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    key="date"
                    align="center"
                    // colSpan= 1
                    className={classes.tableHeadCell}
                    onClick={() => handleSortRequest('created')}
                  >
                    <TableSortLabel active={true} direction={orderDirection.created}>
                      Created at&nbsp;
                    </TableSortLabel>
                  </TableCell>
                  {MODEL_COLUMNS.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      colSpan={column.span}
                      className={classes.tableHeadCell}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {sub_MODEL_COLUMNS.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      colSpan={column.subSpan}
                      className={classes.subModel}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell align="center" colSpan={7}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                )}
                {ItemLists &&
                  ItemLists.map((row: any) => (
                    <TableRow
                      hover
                      key={row.model_id}
                      tabIndex={-1}
                      role="checkbox"
                      onClick={() => handleClick(row.model_id, row.model_version_id)}
                      className={classes.tableRow}
                    >
                      <TableCell className={classes.tableCell} align="center">
                        {row.model_name}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {/* {`${formatDateTime(Date.parse(row.createdAt))}`} */}
                        {/* {row.createdAt} */}
                        {formattedDate(row.created_at)}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {capitalize(row.total_pradictions)}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {/* {`${formatDateTime(row.lastPrediction)}`} */}
                        {formattedDate(row.last_predictions)}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {capitalize(row.num_alert_perf)}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {capitalize(row.num_alert_data_behave)}
                      </TableCell>
                      <TableCell
                        className={classes.tableCell}
                        align="center"
                        sx={{ borderRightWidth: '0px', borderRightColor: colors.white }}
                      >
                        {capitalize(row.num_alert_data_integrity)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <DialogAnimate maxWidth="sm" open={expandForm} onClose={() => setExpandForm(false)}>
            <DialogBox />
          </DialogAnimate>
        </Scrollbar>

        <TablePagination
          page={meta.page - 1}
          component="div"
          count={meta.total}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 50]}
          onRowsPerPageChange={handleChangeRowsPerPage}
          className={classes.pagination}
        />
      </Card>
    </>
  );
};

export default ModelListTable;
