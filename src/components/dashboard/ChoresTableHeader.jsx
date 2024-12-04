import PropTypes from 'prop-types';

const ChoresTableHeader = ({ onSort, sortConfig }) => {
  return (
    <tr className="bg-slate-800 text-slate-300">
      <th className="p-3 cursor-pointer" onClick={() => onSort('is_complete')}>
        Status
      </th>
      <th className="p-3 cursor-pointer" onClick={() => onSort('name')}>
        Task Name
      </th>
      <th className="p-3 cursor-pointer" onClick={() => onSort('location_id')}>
        Location
      </th>
      <th className="p-3">Frequency</th>
      <th className="p-3 cursor-pointer" onClick={() => onSort('last_completed')}>
        Last Completed
      </th>
      <th className="p-3">Actions</th>
    </tr>
  );
};

ChoresTableHeader.propTypes = {
  onSort: PropTypes.func.isRequired,
  sortConfig: PropTypes.shape({
    key: PropTypes.string.isRequired,
    direction: PropTypes.string.isRequired
  }).isRequired
};

export default ChoresTableHeader;