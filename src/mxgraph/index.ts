import './jsdom';
import mxgraph from 'mxgraph';

export const { mxGraph, mxGraphModel, mxGeometry, mxCodec, mxPoint, mxUtils, mxHierarchicalLayout, mxConstants, mxCircleLayout, mxSwimlaneLayout } = mxgraph({
  mxImageBasePath: "./src/images",
  mxBasePath: "./src"
});

(window as any).mxGraphModel = mxGraphModel;
(window as any).mxGeometry = mxGeometry;
(window as any).mxPoint = mxPoint;
