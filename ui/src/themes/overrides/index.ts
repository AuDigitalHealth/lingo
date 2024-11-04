///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

/* eslint-disable */
// material-ui
import { Theme } from '@mui/material/styles';

// third-party
import { merge } from 'lodash';

// project import
import Accordion from './Accordion';
import AccordionDetails from './AccordionDetails';
import AccordionSummary from './AccordionSummary';
import Alert from './Alert';
import AlertTitle from './AlertTitle';
import Autocomplete from './Autocomplete';
import Badge from './Badge';
import Button from './Button';
import ButtonBase from './ButtonBase';
import ButtonGroup from './ButtonGroup';
import CardContent from './CardContent';
import Checkbox from './Checkbox';
import Chip from './Chip';
import Dialog from './Dialog';
import DialogContentText from './DialogContentText';
import DialogTitle from './DialogTitle';
import Fab from './Fab';
import IconButton from './IconButton';
import InputBase from './InputBase';
import InputLabel from './InputLabel';
import LinearProgress from './LinearProgress';
import Link from './Link';
import ListItemButton from './ListItemButton';
import ListItemIcon from './ListItemIcon';
import LoadingButton from './LoadingButton';
import OutlinedInput from './OutlinedInput';
import Pagination from './Pagination';
import PaginationItem from './PaginationItem';
import Popover from './Popover';
import Radio from './Radio';
import Slider from './Slider';
import Switch from './Switch';
import Tab from './Tab';
import TableBody from './TableBody';
import TableCell from './TableCell';
import TableFooter from './TableFooter';
import TableHead from './TableHead';
import TablePagination from './TablePagination';
import TableRow from './TableRow';
import Tabs from './Tabs';
import ToggleButton from './ToggleButton';
import Tooltip from './Tooltip';
import TreeItem from './TreeItem';
import Typography from './Typography';

// ==============================|| OVERRIDES - MAIN ||============================== //

export default function ComponentsOverrides(theme: Theme) {
  return merge(
    Accordion(theme),
    AccordionDetails(theme),
    AccordionSummary(theme),
    Alert(theme),
    AlertTitle(),
    Autocomplete(),
    Badge(theme),
    Button(theme),
    ButtonBase(),
    ButtonGroup(),
    CardContent(),
    Checkbox(theme),
    Chip(theme),
    Dialog(),
    DialogContentText(theme),
    DialogTitle(),
    Fab(theme),
    IconButton(theme),
    InputBase(),
    InputLabel(theme),
    LinearProgress(),
    Link(),
    ListItemButton(theme),
    ListItemIcon(theme),
    LoadingButton(),
    OutlinedInput(theme),
    Pagination(),
    PaginationItem(theme),
    Popover(theme),
    Radio(theme),
    Slider(theme),
    Switch(theme),
    Tab(theme),
    TableBody(theme),
    TableCell(theme),
    TableFooter(theme),
    TableHead(theme),
    TablePagination(),
    TableRow(),
    Tabs(),
    ToggleButton(theme),
    Tooltip(theme),
    TreeItem(),
    Typography(),
  );
}
