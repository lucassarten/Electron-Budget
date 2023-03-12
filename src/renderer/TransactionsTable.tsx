/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import { useCallback, useEffect, useMemo, useState } from 'react';
import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
} from 'material-react-table';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
};

type Category = {
  id: string;
  name: string;
  type: string;
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
const validateCategory = (value: string, categories: Category[]) => {
  const category = categories.find((c) => c.name === value);
  return !!category;
};

interface CreateModalProps {
  columns: MRT_ColumnDef<Transaction>[];
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (values: Transaction) => void;
  open: boolean;
  categories: Category[];
  type: string;
}

export function AddTransactionModal({
  open,
  columns,
  onClose,
  onSubmit,
  categories,
  type,
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
                {categories
                  .filter((category) => category.type === type)
                  .map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
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

function TransactionsTable({ type }: any) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState<Transaction[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    window.electron.ipcRenderer.once('db-query-transactions', (resp) => {
      const response = resp as Transaction[];
      setTableData(response);
    });
    window.electron.ipcRenderer.once('db-query-categories', (resp) => {
      const response = resp as Category[];
      setCategories(response);
    });
    // get categories from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      `SELECT * FROM Categories WHERE ${
        type === 'income' ? 'type = "income"' : 'type = "expense"'
      }`,
      'categories',
    ]);
    // get positive transactions from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      `SELECT * FROM Transactions WHERE ${
        type === 'income' ? 'amount > 0' : 'amount < 0'
      }`,
      'transactions',
    ]);
  }, [type]);

  const handleCreateNewRow = (values: Transaction) => {
    tableData.push(values);
    // insert row into db
    const query = `INSERT INTO Transactions (date, description, amount, category) VALUES ('${values.date}', '${values.description}', ${values.amount}, '${values.category}')`;
    window.electron.ipcRenderer.sendMessage('db-query', [query]);
    setTableData([...tableData]);
  };

  const handleSaveCell = useCallback(
    (cell: MRT_Cell<Transaction>, value: any) => {
      // there is probably a better way to do this
      switch (cell.column.id) {
        case 'date':
          tableData[cell.row.index].date = value;
          break;
        case 'description':
          tableData[cell.row.index].description = value;
          break;
        case 'amount':
          tableData[cell.row.index].amount = value;
          break;
        case 'category':
          tableData[cell.row.index].category = value;
          break;
        default:
          break;
      }
      // update row in db
      const query = `UPDATE Transactions SET date = '${
        tableData[cell.row.index].date
      }', description = '${tableData[cell.row.index].description}', amount = ${
        tableData[cell.row.index].amount
      }, category = '${tableData[cell.row.index].category}' WHERE id = ${
        tableData[cell.row.index].id
      }`;
      window.electron.ipcRenderer.sendMessage('db-query', [query]);
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
        onFocus: () => {
          delete validationErrors[cell.id];
          setValidationErrors({
            ...validationErrors,
          });
        },
        onChange: (event) => {
          const isValid =
            cell.column.id === 'date'
              ? validateDate(event.target.value)
              : cell.column.id === 'amount'
              ? validateAmount(event.target.value)
              : cell.column.id === 'category'
              ? validateCategory(event.target.value, categories)
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
        onBlur: (event) => {
          const isValid =
            cell.column.id === 'date'
              ? validateDate(event.target.value)
              : cell.column.id === 'amount'
              ? validateAmount(event.target.value)
              : cell.column.id === 'category'
              ? validateCategory(event.target.value, categories)
              : validateRequired(event.target.value);
          if (isValid) {
            handleSaveCell(cell, event.target.value);
          }
        },
      };
    },
    [categories, handleSaveCell, validationErrors]
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
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          select: true,
          children: categories
            .filter((category) => category.type === type)
            .map((category) => (
              <MenuItem key={category.id} value={category.name}>
                {category.name}
              </MenuItem>
            )),
          ...getCommonEditTextFieldProps(cell),
        }),
      },
    ],
    [categories, getCommonEditTextFieldProps, type]
  );

  return (
    <div className="transactions-table">
      <MaterialReactTable
        enableStickyHeader
        enablePagination={false}
        columns={columns}
        data={tableData}
        enableColumnOrdering
        editingMode="cell"
        enableEditing
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
        categories={categories}
        type={type}
      />
    </div>
  );
}

export default TransactionsTable;
