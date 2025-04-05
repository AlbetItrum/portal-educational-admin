import React from 'react'
import {Link, withRouter} from 'react-router-dom'
import http from './../http/http'
// import Spinner from '../Spinner/Spinner'
import m from './../m/m'
import MyModal from './../MyModal/MyModal'
import Smart from './../Smart'
import './table.css'
import ReactPaginate from 'react-paginate';

let timer = -1;
let _ = window._;
let $ = window.$;

class TableFilter1 extends React.Component {

  constructor(props) {
    super(props);

  }

  render() {


    let {
      items, TopComp, own_top, page_count,
      search, active_filter, onChangeFilter,
      top_filters, per_page, page, data, total,
      onPerPage, onSearch, changeFilter, onChange, onAdd,
      onPage,
    } = this.props;

    // console.log('*........ ## page_count', data, page_count, page, onPage);
    return <div>
      {data.length !== 0 && <div className="pull-left">
        <small>Стр <b>{page}</b>; Всего <b>{total}</b>
        </small>
      </div>}
      <div className="pull-right">
        <ReactPaginate previousLabel={"<"}
                       nextLabel={">"}
                       breakLabel={<span>...</span>}
                       breakClassName={"break-me"}
                       pageCount={page_count || 1}
                       forcePage={page - 1}
                       marginPagesDisplayed={2}
                       pageRangeDisplayed={5}
                       onPageChange={onPage}
                       containerClassName={"pagination"}
                       subContainerClassName={"pages pagination"}
                       activeClassName={"active"}
        />
      </div>
    </div>
  }

}

// global.Table = Table;

export default TableFilter1
