import { component, componentId } from "@traxjs/trax-preact";

export interface ImgItem {
    /** Image source - url or base64 data */
    src: string;
    /** Image width */
    width: number;
    /** Alt text for this image */
    alt: string;
    /** URL from where the image was extracted */
    lpage: string;
    /** Unique identifier */
    ved: string;
}


export const ImgList = component("ImgList", (props: { height?: number, imgs?: ImgItem[] }) => {
    let { height, imgs } = props;
    height = height || 150;

    return <div data-id={componentId()} className='imgList'>
        <div className='inline-block border rounded-xl overflow-hidden'
            style={{ height: height + "px" }}>
            {imgs?.map((img, idx) => {
                const ms = (idx === 0) ? "" : "ms-1";

                return <div className={`inline-block ${ms}`} style={{ height: height, width: img.width }}>
                    <img alt={img.alt} src={img.src} className="h-full w-full" />
                </div>
            })}
        </div>
    </div>
});
