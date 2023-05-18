import { component, componentId } from "@traxjs/trax-preact";

export interface ImgProps {
    height: number;
    width: number;
    alt: string;
    href: string;
    src: string;
}

export const Img = component("Img", (props: ImgProps) => {
    let { height, width, alt, src, href } = props;

    return <div data-id={componentId()} className='img inline-block border rounded-md overflow-hidden' style={{ height, width }} >
        <a href={href}>
            <img style={{ height, width }} alt={alt} src={src} />
        </a>
    </div>
});
