import React from 'react'
import ReactExtender from './../ReactExtender/ReactExtender';
import MyModal from "../MyModal/MyModal";
import './ImageUploader.css';
import DeleteButton from "../DeleteButton/DeleteButton";
import Select from './../Select';
import Hr from './../Hr/Hr';
import Button from './../Button/Button'

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


class ImageUploader extends ReactExtender {

    constructor(props) {
        super(props);
        this.id = 'id_' + makeid(10);
        this.src = this.props.src;
        this.state = {aspectRatio: this.props.aspectRatio, loading: true, item: {}, pass_item: {}};
    }


    componentDidMount() {
    }

    setCropper(vv) {
        let _this = this;
        let src = _this.file_src;
        let id = _this.id;
        let el = window.$('#for_' + id);
        el.html(`<img src="${src}" id="${id}" />`);

        let opts = {
            // options
            onCropEnd: function (value) {
                // console.log(value.x, value.y, value.width, value.height);
                _this.cropper_value = value;
            },
            onInitialize: function (value) {
                setTimeout(() => {
                    _this.cropper_value = croppr.getValue();
                })
            }
        };


        let aspectRatio = _this.props.forseAspectRatio || _this.state.aspectRatio

        if (aspectRatio) {
            opts.aspectRatio = +aspectRatio;
        }
        // console.log('*........ ## aspectRatio', opts, aspectRatio, _this);

        let croppr = new window.Croppr('#' + id, opts);

    }

    upload(cb) {

        // console.log("qqqqq this.props.item || {}", this.props.item || {});
        let _this = this;
        this.resize();
        global.http.post(this.props.url || '/img-uploader', {
            base64: this.dataURL,
            _id: (this.props.item || {})._id
        })
            .then(r => {
                _this.modal && _this.modal.hide();
                // window.notify('Image successfully uploaded');
                this.props.onChange && this.props.onChange({base64: this.dataURL, r, url: r});

                // let el2 = window.$('#preview_' + _this.id);
                // el2.html(`<img src="${this.dataURL}" />`);
                // console.log('*........ ## elllllllllll2', el2);

                cb && cb();
            })
            .catch(e => {
                // console.log('*........ ## eeeeeeeeeeeeeeeeeee', e);
                cb && cb();
            })

    }

    resize(cb) {
        cb && cb()

        let cv = this.cropper_value;
        let id = this.id;
        let $ = window.$;


        let sel = '#for_' + id + ' .croppr-imageClipped';
        let sel2 = '#for_' + id + ' img';
        // console.log('*........ ## selllllllllllll', sel);
        var img = $(sel)[0] || $(sel2)[0];

        //Find the part of the image that is inside the crop box
        var crop_canvas,
            left = cv.x,
            top = cv.y,
            width = cv.width,
            height = cv.height;

        crop_canvas = $('#canvas_' + id)[0];

        crop_canvas.width = width;
        crop_canvas.height = height;

        crop_canvas.getContext('2d').drawImage(img, left, top, width, height, 0, 0, width, height);
        this.dataURL = crop_canvas.toDataURL("image/png");

    }

    readURL(_inp) {
        let _this = this;
        let inp = window.$(`[relative-id="${this.id}"]`)[0]
        if (inp.files && inp.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                _this.file_src = e.target.result;
                _this.setCropper();
                inp.value = ''

            };

            reader.readAsDataURL(inp.files[0]);
        }
    }


    on_delete() {
        // console.log('*........ ## on delete');
        this.onChange && this.onChange(null);
    }

    render() {
        // let {Select, Button, Hr} = global;
        let {label, placeholder, preview_size = 'full'} = this.props;

        label = label || placeholder;


        // this.src = this.props.src //|| (this.is_deleted ? this.src : this.props.src);
        let src = this.props.src;
        return (<div className={("afade " + preview_size)}>
                {label && <small>{label}</small>}
                <DeleteButton opacity={.4} onClick={(e) => {
                    this.on_delete()
                }}></DeleteButton>

                <div className="rel img_preview">
                    <input type='file' relative-id={this.id}
                           style={{
                               position: 'absolute',
                               height: '100%',
                               width: '100%',
                               left: '0',
                               top: '0',
                               opacity: '0',
                           }}
                           onChange={(el) => {
                               this.readURL(el)
                               this.modal && this.modal.show()
                           }}/>
                    <div id={'preview_' + this.id}>
                        {src ? <div><img src={global.env.domain + src} alt=""/></div> : null}
                        {!src ? <div className={'tc drop_text'}>Drop file here to upload</div> : null}
                    </div>
                </div>


                <MyModal
                    ref={(el) => {
                        window.mm = el;
                        this.modal = el
                    }}
                >
                    <div>
                        <div className="ib">
                          <Button onClick={(e) => {
                            this.upload(e)
                          }}>Upload</Button>
                        </div>

                        <div className="ib"
                             style={{
                               verticalAlign: 'top',
                               marginLeft   : '10px'
                             }}>
                          <Select
                            items={[
                              {value: 0, name: 'Any'},
                              {value: 1, name: '1x1 (avatar)'},
                              {value: 0.75, name: '4x3 (portfolio)'},
                              {value: 0.5625, name: '16x9 (youtube)'}
                            ]}
                            disabled={this.props.forseAspectRatio}
                            value={this.props.forseAspectRatio || this.state.aspectRatio}
                            onChange={(v, a, b, c) => {
                              this.setState({aspectRatio: +v}, () => {
                                this.setCropper()
                              })
                            }}
                          ></Select>


                        </div>
                        <hr/>

                        <div id={'for_' + this.id}>
                        </div>
                    </div>
                </MyModal>

                <canvas className={'dn'} id={"canvas_" + this.id}></canvas>

            </div>
        )
    }
}

export default ImageUploader
