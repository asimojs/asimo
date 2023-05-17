import { component, componentId } from "@traxjs/trax-preact";

export interface ImgProps {
    height: number;
    width: number;
    alt: string;
    href?: string;
    src: string;
}

export const Img = component("Img", (props: ImgProps) => {
    let { height, width, alt, src } = props;

    return <div data-id={componentId()} className='img inline-block' style={{ height, width }} >
        <img style={{ height, width }} alt={alt} src={src} />
    </div>
});
