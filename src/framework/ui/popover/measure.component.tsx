import React from 'react';
import {
  findNodeHandle,
  UIManager,
  View,
  ViewProps,
  Dimensions,
  ScaledSize,
} from 'react-native';
import { Frame } from './type';

export type MeasuringElement = React.ReactElement<MeasuringElementProps>;
export type MeasuringElementProps = { tag: string | number } & any;
export type MeasuringNode = React.ReactElement<MeasureNodeProps>;
export type MeasuringNodeProps = MeasureNodeProps & ViewProps;

export type MeasuredElementProps = MeasuringElementProps & { frame: Frame };
export type MeasuredElement = React.ReactElement<MeasuredElementProps>;

export interface MeasureResult {
  [tag: string]: Frame;
}

export interface MeasureElementProps {
  onResult: (result: MeasuredElement) => void;
  children: MeasuringElement;
}

export interface MeasureNodeProps {
  onResult: (result: MeasureResult) => void;
  children: MeasuringElement[];
}

export const MeasureElement = (props: MeasureElementProps): MeasuringElement => {

  const ref: React.RefObject<any> = React.createRef();

  const { children, onResult } = props;

  const bindToWindow = (frame: Frame, window: ScaledSize): Frame => {
    if (frame.origin.x < window.width) {
      return frame;
    }

    const boundFrame: Frame = new Frame(
      frame.origin.x - window.width,
      frame.origin.y,
      frame.size.width,
      frame.size.height,
    );

    return bindToWindow(boundFrame, window);
  };

  const measureSelf = () => {
    const node: number = findNodeHandle(ref.current);

    UIManager.measureInWindow(node, (x: number, y: number, w: number, h: number) => {
      const window: ScaledSize = Dimensions.get('window');
      const frame: Frame = bindToWindow(new Frame(x, y, w, h), window);

      const measuredElement: MeasuredElement = React.cloneElement(children, { frame });

      onResult(measuredElement);
    });
  };

  return React.cloneElement(children, {
    ref,
    onLayout: measureSelf,
  });
};

export const MeasureNode = (props: MeasuringNodeProps): MeasuringNode => {

  const result: MeasureResult = {};

  const { children, onResult, ...derivedProps } = props;

  const onChildMeasure = (element: MeasuredElement) => {
    const { tag, frame } = element.props;

    result[tag] = frame;

    if (Object.keys(result).length === children.length) {
      onResult(result);
    }
  };

  const createMeasuringElement = (element: MeasuringElement, index: number): MeasuringElement => {
    return (
      <MeasureElement
        key={index}
        onResult={onChildMeasure}>
        {element}
      </MeasureElement>
    );
  };

  return (
    <View
      {...derivedProps}>
      {children.map(createMeasuringElement)}
    </View>
  );
};