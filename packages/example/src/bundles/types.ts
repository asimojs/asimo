
export interface ComponentBundle {
    [name: string]: Component;
}

type Component = (props:any) => JSX.Element;

