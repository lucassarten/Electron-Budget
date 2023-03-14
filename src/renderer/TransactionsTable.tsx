/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import { useCallback, useEffect, useMemo, useState } from 'react';
import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
  MRT_RowSelectionState,
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

import { buttonStyleAdd, buttonStyleCancel } from './styles/MUI';

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
const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
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
const validateModal = (values: any, type: string) => {
  return (
    validateAmount(values.amount) &&
    validateRequired(values.amount) &&
    ((type === 'income' && Number(values.amount) > 0) ||
      (type === 'expense' && Number(values.amount) < 0))
  );
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

  categories
    .filter((category) => category.type === type)
    .map((category) => console.log(category.name));

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Add {type}</DialogTitle>
      <DialogContent>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="add-transaction-form"
        >
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem',
            }}
          >
            {
              // date picker
              columns.slice(1, 2).map((column) => (
                // date picker
                <TextField
                  key={column.accessorKey}
                  label={column.header}
                  name={column.accessorKey}
                  onChange={(e) =>
                    setValues({ ...values, [e.target.name]: e.target.value })
                  }
                  type="date"
                  required
                  error={!validateDate(values.date)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              ))
            }
            {columns.slice(2, 3).map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
                required
                error={!validateRequired(values.description)}
              />
            ))}
            {columns.slice(3, 4).map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
                required
                error={!validateModal(values, type)}
                helperText={
                  !validateAmount(values.amount)
                    ? `${column.accessorKey} must be a number`
                    : type === 'income' && Number(values.amount) < 0
                    ? `income must be positive`
                    : type === 'expense' && Number(values.amount) > 0
                    ? `expense must be negative`
                    : ''
                }
              />
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
                defaultValue="❓ Other"
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
        <Button onClick={onClose} style={buttonStyleCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          style={
            !validateModal(values, type) ||
            !validateRequired(values.description)
              ? buttonStyleAdd.disabled
              : buttonStyleAdd
          }
          // inactive if there are validation errors
          disabled={
            !validateModal(values, type) ||
            !validateRequired(values.description)
          }
        >
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
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

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
      'db-query-categories',
      `SELECT * FROM Categories WHERE ${
        type === 'income' ? 'type = "income"' : 'type = "expense"'
      }`,
    ]);
    // get positive transactions from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      'db-query-transactions',
      `SELECT * FROM Transactions WHERE ${
        type === 'income' ? 'amount > 0' : 'amount < 0'
      }`,
    ]);
  }, [type]);

  const handleCreateNewRow = (values: Transaction) => {
    tableData.push(values);
    // insert row into db
    window.electron.ipcRenderer.sendMessage('db-query', [
      '',
      `INSERT INTO Transactions (date, description, amount, category) VALUES ('${values.date}', '${values.description}', ${values.amount}, '${values.category}')`,
    ]);
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
      window.electron.ipcRenderer.sendMessage('db-query', [
        '',
        `UPDATE Transactions SET date = '${
          tableData[cell.row.index].date
        }', description = '${
          tableData[cell.row.index].description
        }', amount = ${tableData[cell.row.index].amount}, category = '${
          tableData[cell.row.index].category
        }' WHERE id = ${tableData[cell.row.index].id}`,
      ]);
      setTableData([...tableData]);
    },
    [tableData]
  );

  const handleDeleteRows = useCallback(() => {
    // loop through selected rows and delete them from tableData
    const newTableData = tableData.filter((row) => !rowSelection[row.id]);
    console.log(rowSelection);
    // delete rows from db
    const query = `DELETE FROM Transactions WHERE id IN (${
      Object.keys(rowSelection) as string[]
    })`;
    console.log(query);
    window.electron.ipcRenderer.sendMessage('db-query', ['', query]);
    setTableData(newTableData);
    setRowSelection({});
  }, [rowSelection, tableData]);

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
        // date picker
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'date',
          format: 'dd/MM/yyyy',
        }),
        // display as dd/MM/yyyy
        Cell: ({ cell }) => formatDate(cell.getValue() as string),
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
        enableRowSelection
        onRowSelectionChange={setRowSelection}
        state={{ rowSelection }}
        // hide bottom toolbar
        muiBottomToolbarProps={
          {
            style: {
              display: 'none',
            },
          } as any
        }
        getRowId={(row) => row.id}
        renderTopToolbarCustomActions={() => (
          <span className="table-top-toolbar-container">
            <button
              className="button-add-transaction"
              type="button"
              onClick={() => setCreateModalOpen(true)}
            >
              Add
            </button>
            <button
              className="button-delete-transaction"
              type="button"
              disabled={Object.keys(rowSelection).length === 0}
              onClick={() => handleDeleteRows()}
            >
              Delete
            </button>
          </span>
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
