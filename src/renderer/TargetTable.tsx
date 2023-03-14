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
  Stack,
  TextField,
} from '@mui/material';

import { buttonStyleAdd, buttonStyleCancel } from './styles/MUI';

import { Category } from './Types';

const validateRequired = (value: string) => !!value.length;
const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NZD',
    currencyDisplay: 'symbol',
  });
  return formatter.format(value);
};
const validateAmount = (value: string) => {
  const number = Number(value);
  return !Number.isNaN(number);
};
const validateModal = (values: any, type: string) => {
  return (
    validateAmount(values.target) &&
    validateRequired(values.target) &&
    ((type === 'income' && Number(values.target) > 0) ||
      (type === 'expense' && Number(values.target) < 0)) &&
    validateRequired(values.name)
  );
};

interface CreateModalProps {
  columns: MRT_ColumnDef<Category>[];
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (values: Category) => void;
  open: boolean;
  type: string;
}

export function AddCategoryModal({
  open,
  columns,
  onClose,
  onSubmit,
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
      <DialogTitle textAlign="center">Add {type}</DialogTitle>
      <DialogContent>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="add-category-form"
        >
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem',
            }}
          >
            {columns.slice(1, 2).map((column) => (
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
                  !validateAmount(values.target)
                    ? `${column.accessorKey} must be a number`
                    : type === 'income' && Number(values.target) < 0
                    ? `income must be positive`
                    : type === 'expense' && Number(values.target) > 0
                    ? `expense must be negative`
                    : ''
                }
              />
            ))}
            {columns.slice(2, 3).map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
                required
                error={!validateRequired(values.name)}
                helperText={!validateRequired(values.name) ? 'Required' : ''}
              />
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
            !validateModal(values, type)
              ? buttonStyleAdd.disabled
              : buttonStyleAdd
          }
          // inactive if there are validation errors
          disabled={!validateModal(values, type)}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TargetTable({ type }: any) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState<Category[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  useEffect(() => {
    window.electron.ipcRenderer.once('db-query-categories', (resp) => {
      const response = resp as Category[];
      setTableData(response);
    });
    // get categories from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      'db-query-categories',
      `SELECT * FROM Categories WHERE type = "${type}"`,
    ]);
  }, [type]);

  const handleCreateNewRow = (values: Category) => {
    tableData.push(values);
    // insert row into db
    window.electron.ipcRenderer.sendMessage('db-query', [
      '',
      `INSERT INTO Categories (name, type, target) VALUES ('${values.name}', ${type}, ${values.target})`,
    ]);
    setTableData([...tableData]);
  };

  const handleSaveCell = useCallback(
    (cell: MRT_Cell<Category>, value: any) => {
      // there is probably a better way to do this
      switch (cell.column.id) {
        case 'name':
          tableData[cell.row.index].name = value;
          break;
        case 'target':
          tableData[cell.row.index].target = value;
          break;
        default:
          break;
      }
      // update row in db
      window.electron.ipcRenderer.sendMessage('db-query', [
        '',
        `UPDATE Categories SET name = '${
          tableData[cell.row.index].name
        }', target = ${tableData[cell.row.index].target} WHERE id = ${
          tableData[cell.row.index].id
        }`,
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
    const query = `DELETE FROM Categories WHERE id IN (${
      Object.keys(rowSelection) as string[]
    })`;
    console.log(query);
    window.electron.ipcRenderer.sendMessage('db-query', ['', query]);
    setTableData(newTableData);
    setRowSelection({});
  }, [rowSelection, tableData]);

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<Category>
    ): MRT_ColumnDef<Category>['muiTableBodyCellEditTextFieldProps'] => {
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
            cell.column.id === 'target'
              ? validateAmount(event.target.value)
              : cell.column.id === 'category'
              ? validateRequired(event.target.value)
              : true;
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
            cell.column.id === 'target'
              ? validateAmount(event.target.value)
              : cell.column.id === 'category'
              ? validateRequired(event.target.value)
              : true;
          if (isValid) {
            handleSaveCell(cell, event.target.value);
          }
        },
      };
    },
    [handleSaveCell, validationErrors]
  );

  const columns = useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        enableColumnOrdering: false,
        enableEditing: false,
        enableSorting: false,
        size: 50,
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
        accessorKey: 'name',
        header: 'name',
        size: 100,
        // date picker
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: 'target',
        header: 'target',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
        // format as currency
        Cell: ({ cell }) => formatCurrency(cell.getValue() as number),
      },
    ],
    [getCommonEditTextFieldProps]
  );

  return (
    <div className="targets-table">
      <MaterialReactTable
        enableStickyHeader
        enablePagination={false}
        columns={columns}
        data={tableData}
        editingMode="table"
        enableEditing
        enableRowSelection
        onRowSelectionChange={setRowSelection}
        state={{ rowSelection }}
        getRowId={(row) => row.id}
        renderTopToolbarCustomActions={() => (
          <span className="table-top-toolbar-container">
            <button
              className="button-add-category"
              type="button"
              onClick={() => setCreateModalOpen(true)}
            >
              Add
            </button>
            <button
              className="button-delete-category"
              type="button"
              disabled={Object.keys(rowSelection).length === 0}
              onClick={() => handleDeleteRows()}
            >
              Delete
            </button>
          </span>
        )}
      />
      <AddCategoryModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
        type={type}
      />
    </div>
  );
}

function TargetTables() {
  // create expense and income tables side by side
  return (
    <div className="target-tables-container">
      <div className="expense-targets-table">
        <h2>Expenses</h2>
        <TargetTable type="expense" className="target-table" />
      </div>
      <div className="income-targets-table">
        <h2>Income</h2>
        <TargetTable type="income" className="target-table" />
      </div>
    </div>
  );
}

export default TargetTables;
