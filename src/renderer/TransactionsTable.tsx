/* eslint-disable camelcase */
import { useCallback, useEffect, useMemo, useState } from 'react';
import MaterialReactTable, {
  MaterialReactTableProps,
  MRT_Cell,
  MRT_ColumnDef,
  MRT_Row,
} from 'material-react-table';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
};

const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NZD',
    currencyDisplay: 'symbol',
  });
  return formatter.format(value);
};
const validateRequired = (value: string) => !!value.length;
const validateDate = (value: string) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};
const validateAmount = (value: string) => {
  const number = Number(value);
  return !Number.isNaN(number);
};

interface CreateModalProps {
  columns: MRT_ColumnDef<Transaction>[];
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (values: Transaction) => void;
  open: boolean;
}

export function AddTransactionModal({
  open,
  columns,
  onClose,
  onSubmit,
}: CreateModalProps) {
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = '';
      return acc;
    }, {} as any)
  );
  const [categoires, setCategoires] = useState<string[]>([]);

  useEffect(() => {
    // get categories from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      'SELECT * FROM Categories',
    ]);
    // wait for response
    window.electron.ipcRenderer.once('db-query', (resp) => {
      // cast response to array of categories
      setCategoires(resp as string[]);
    });
  }, []);

  const handleSubmit = () => {
    // put your validation logic here
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Add Transaction</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem',
            }}
          >
            {columns.slice(1, 4).map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
              />
              // catergory dropdown
            ))}
            {columns.slice(4).map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
                select
              >
                {categoires.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="secondary" onClick={handleSubmit} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TransactionsTable({ filter }: any) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState<Transaction[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});
  const [categoires, setCategoires] = useState<string[]>([]);

  useEffect(() => {
    let data: Transaction[] = [];
    // get positive transactions from db
    const query = `SELECT * FROM Transactions WHERE ${filter as string}`;
    window.electron.ipcRenderer.sendMessage('db-query', [query]);
    // wait for response
    window.electron.ipcRenderer.once('db-query', (resp) => {
      // cast response to array of transactions
      data = resp as Transaction[];
      setTableData(data);
    });
    // get categories from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      'SELECT * FROM Categories',
    ]);
    // wait for response
    window.electron.ipcRenderer.once('db-query', (resp) => {
      // cast response to array of categories
      setCategoires(resp as string[]);
    });
  }, [filter]);

  const handleCreateNewRow = (values: Transaction) => {
    tableData.push(values);
    // insert row into db
    const query = `INSERT INTO Transactions (date, description, amount, category) VALUES ('${values.date}', '${values.description}', ${values.amount}, '${values.category}')`;
    window.electron.ipcRenderer.sendMessage('db-query', [query]);
    setTableData([...tableData]);
  };

  const handleSaveRowEdits: MaterialReactTableProps<Transaction>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        tableData[row.index] = values;
        // update row in db
        const query = `UPDATE Transactions SET date = '${values.date}', description = '${values.description}', amount = ${values.amount}, category = '${values.category}' WHERE id = ${values.id}`;
        window.electron.ipcRenderer.sendMessage('db-query', [query]);
        setTableData([...tableData]);
        exitEditingMode(); // required to exit editing mode and close modal
      }
    };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    (row: MRT_Row<Transaction>) => {
      // delete row from db
      const query = `DELETE FROM Transactions WHERE id = ${row.original.id}`;
      window.electron.ipcRenderer.sendMessage('db-query', [query]);
      tableData.splice(row.index, 1);
      setTableData([...tableData]);
    },
    [tableData]
  );

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<Transaction>
    ): MRT_ColumnDef<Transaction>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            // eslint-disable-next-line no-nested-ternary
            cell.column.id === 'date'
              ? validateDate(event.target.value)
              : cell.column.id === 'amount'
              ? validateAmount(event.target.value)
              : validateRequired(event.target.value);
          if (!isValid) {
            // set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is invalid`,
            });
          } else {
            // remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors]
  );

  const columns = useMemo<MRT_ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        enableColumnOrdering: false,
        enableEditing: false,
        enableSorting: false,
        size: 50,
        hide: true, // no clue why this doesn't work so will have to do below
        // hide header
        muiTableHeadCellProps: {
          style: {
            display: 'none',
          },
        },
        // hide cell
        muiTableBodyCellProps: {
          style: {
            display: 'none',
          },
        },
      },
      {
        accessorKey: 'date',
        header: 'Date',
        size: 100,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 250,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
        // format as currency
        Cell: ({ cell }) => formatCurrency(cell.getValue() as number),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 50,
        muiTableBodyCellEditTextFieldProps: {
          select: true,
          children: categoires.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          )),
        },
      },
    ],
    [categoires, getCommonEditTextFieldProps]
  );

  return (
    <div className="transactions-table">
      <MaterialReactTable
        displayColumnDefOptions={{
          'mrt-row-actions': {
            muiTableHeadCellProps: {
              align: 'center',
            },
            size: 120,
          },
        }}
        enableStickyHeader
        enablePagination={false}
        columns={columns}
        data={tableData}
        editingMode="modal" // default
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Tooltip arrow placement="left" title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement="right" title="Delete">
              <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        renderTopToolbarCustomActions={() => (
          <button
            className="button-add-transaction"
            type="button"
            color="secondary"
            onClick={() => setCreateModalOpen(true)}
          >
            Add Transaction
          </button>
        )}
      />
      <AddTransactionModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </div>
  );
}

export default TransactionsTable;
