/* eslint-disable camelcase */
import { useCallback, useMemo, useState } from 'react';
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

const categoires = ['Food', 'Rent', 'Utilities', 'Transportation', 'Other'];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
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
            {columns.map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
              />
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

function TransactionsTable() {
  const data = useMemo<Transaction[]>(() => {
    return [
      {
        id: '1',
        date: '2021-01-01',
        description: 'Groceries',
        amount: 100,
        category: 'Food',
      },
      {
        id: '2',
        date: '2021-01-02',
        description: 'Rent',
        amount: 1000,
        category: 'Rent',
      },
      {
        id: '2',
        date: '2021-01-02',
        description: 'Rent',
        amount: 1000,
        category: 'Rent',
      },
      {
        id: '2',
        date: '2021-01-02',
        description: 'Rent',
        amount: 1000,
        category: 'Rent',
      },
      {
        id: '2',
        date: '2021-01-02',
        description: 'Rent',
        amount: 1000,
        category: 'Rent',
      },
      {
        id: '2',
        date: '2021-01-02',
        description: 'Rent',
        amount: 1000,
        category: 'Rent',
      },
      {
        id: '2',
        date: '2021-01-02',
        description: 'Rent',
        amount: 1000,
        category: 'Rent',
      },
      {
        id: '4',
        date: '2021-01-02',
        description: 'Rent',
        amount: 1000,
        category: 'Rent',
      },
    ];
  }, []);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState<Transaction[]>(() => data);
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});

  const handleCreateNewRow = (values: Transaction) => {
    tableData.push(values);
    setTableData([...tableData]);
  };

  const handleSaveRowEdits: MaterialReactTableProps<Transaction>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        tableData[row.index] = values;
        // send/receive api updates here, then refetch or update local table data for re-render
        setTableData([...tableData]);
        exitEditingMode(); // required to exit editing mode and close modal
      }
    };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    (row: MRT_Row<Transaction>) => {
      // send api delete request here, then refetch or update local table data for re-render
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
              [cell.id]: `${cell.column.columnDef.header} is required`,
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
        enableEditing: false, // disable editing on this column
        enableSorting: false,
        size: 80,
      },
      {
        accessorKey: 'date',
        header: 'Date',
        size: 140,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 140,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        muiTableBodyCellEditTextFieldProps: {
          select: false,
          children: categoires.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          )),
        },
      },
    ],
    [getCommonEditTextFieldProps]
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
