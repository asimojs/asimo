
export interface ComponentBundle {
    [name: string]: Component;
}

type Component = (props?: { [key: string]: any }) => JSX.Element;

