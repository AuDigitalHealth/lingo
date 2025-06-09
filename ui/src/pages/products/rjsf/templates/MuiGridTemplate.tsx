import classNames from 'classnames';
import isObject from 'lodash/isObject';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import {
  FormContextType,
  GenericObjectType,
  ObjectFieldTemplateProps,
  ObjectFieldTemplatePropertyType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId,
} from '@rjsf/utils';
import Col from 'antd/lib/col';
import Row from 'antd/lib/row';
import {
  ConfigConsumer,
  ConfigConsumerProps,
} from 'antd/lib/config-provider/context';

const DESCRIPTION_COL_STYLE = {
  paddingBottom: '8px',
};

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function MuiGridTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    disabled,
    formContext,
    formData,
    idSchema,
    onAddClick,
    properties,
    readonly,
    required,
    registry,
    schema,
    title,
    uiSchema,
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>(
    'TitleFieldTemplate',
    registry,
    uiOptions,
  );
  const DescriptionFieldTemplate = getTemplate<
    'DescriptionFieldTemplate',
    T,
    S,
    F
  >('DescriptionFieldTemplate', registry, uiOptions);
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  // Default Ant Design grid properties from formContext or fallback values
  const {
    colSpan = 24,
    labelAlign = 'right',
    rowGutter = 24,
  } = formContext as GenericObjectType;

  // Helper functions (optional, but can make code cleaner)
  const findSchema = (element: ObjectFieldTemplatePropertyType): S =>
    element.content.props.schema;
  const findUiSchema = (
    element: ObjectFieldTemplatePropertyType,
  ): UiSchema<T, S, F> | undefined => element.content.props.uiSchema;
  const findUiSchemaField = (element: ObjectFieldTemplatePropertyType) =>
    getUiOptions(findUiSchema(element)).field;
  const findUiSchemaWidget = (element: ObjectFieldTemplatePropertyType) =>
    getUiOptions(findUiSchema(element)).widget;

  // This function is from the original code, used when ui:grid is NOT defined.
  // Keeping it for fallback behavior.
  const calculateColSpan = (element: ObjectFieldTemplatePropertyType) => {
    const type = findSchema(element).type; // Access type from schema directly
    const field = findUiSchemaField(element);
    const widget = findUiSchemaWidget(element);

    const defaultColSpan =
      properties.length < 2 || // Single or no field in object.
      type === 'object' ||
      type === 'array' ||
      widget === 'textarea'
        ? 24
        : 12;

    if (isObject(colSpan)) {
      const colSpanObj: GenericObjectType = colSpan;
      if (isString(widget)) {
        return colSpanObj[widget];
      }
      if (isString(field)) {
        return colSpanObj[field];
      }
      if (isString(type)) {
        return colSpanObj[type];
      }
    }
    if (isNumber(colSpan)) {
      return colSpan;
    }
    return defaultColSpan;
  };

  return (
    <ConfigConsumer>
      {(configProps: ConfigConsumerProps) => {
        const { getPrefixCls } = configProps;
        const prefixCls = getPrefixCls('form');
        const labelClsBasic = `${prefixCls}-item-label`;
        const labelColClassName = classNames(
          labelClsBasic,
          labelAlign === 'left' && `${labelClsBasic}-left`,
          // labelCol.className, // Assuming labelCol is defined elsewhere if needed
        );

        // Get the names of all properties that need to be rendered
        const propertyNames = properties.map(p => p.name);

        return (
          <span id={idSchema.$id}>
            <Row gutter={rowGutter}>
              {title && !uiOptions.skipTitle && (
                <Col className={labelColClassName} span={24}>
                  <TitleFieldTemplate
                    id={titleId<T>(idSchema)}
                    title={title}
                    required={required}
                    schema={schema}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </Col>
              )}
              {description && (
                <Col span={24} style={DESCRIPTION_COL_STYLE}>
                  <DescriptionFieldTemplate
                    id={descriptionId<T>(idSchema)}
                    description={description}
                    schema={schema}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </Col>
              )}
              {/* Check if ui:grid is defined and is an array */}
              {uiSchema?.['ui:grid'] && Array.isArray(uiSchema['ui:grid'])
                ? // Iterate through each row defined in ui:grid
                  uiSchema['ui:grid'].map((ui_row, rowIndex) => {
                    // Iterate through each item (field name or placeholder) in the current row
                    return Object.keys(ui_row).map(row_item => {
                      // Find the corresponding property element from RJSF's properties array
                      const element = properties.find(p => p.name === row_item);

                      if (element) {
                        return (
                          <Col key={element.name} span={ui_row[row_item]}>
                            {!element.hidden && element.content}
                          </Col>
                        );
                      } else {
                        // Check if this is a layout-only group key defined in the uiSchema
                        const nestedGrid = uiSchema?.[row_item]?.['ui:grid'];
                        if (nestedGrid && Array.isArray(nestedGrid)) {
                          return (
                            <Col
                              key={`group-${rowIndex}-${row_item}`}
                              span={ui_row[row_item]}
                            >
                              <Row gutter={rowGutter}>
                                {nestedGrid.map((nestedRow, nestedIndex) =>
                                  Object.keys(nestedRow).map(nestedItem => {
                                    const nestedElement = properties.find(
                                      p => p.name === nestedItem,
                                    );
                                    if (nestedElement) {
                                      return (
                                        <Col
                                          key={`${nestedItem}-${nestedIndex}`}
                                          span={nestedRow[nestedItem]}
                                        >
                                          {!nestedElement.hidden &&
                                            nestedElement.content}
                                        </Col>
                                      );
                                    } else {
                                      return (
                                        <Col
                                          key={`empty-nested-${nestedIndex}-${nestedItem}`}
                                          span={nestedRow[nestedItem]}
                                        >
                                          <span />
                                        </Col>
                                      );
                                    }
                                  }),
                                )}
                              </Row>
                            </Col>
                          );
                        }
                        // Otherwise just render empty placeholder column
                        return (
                          <Col
                            key={`empty-${rowIndex}-${row_item}`}
                            span={ui_row[row_item]}
                          >
                            <span />
                          </Col>
                        );
                      }
                    });
                  })
                : // Fallback to default rendering if ui:grid is not defined or invalid
                  properties
                    .filter(e => !e.hidden)
                    .map((element: ObjectFieldTemplatePropertyType) => (
                      <Col key={element.name} span={calculateColSpan(element)}>
                        {element.content}
                      </Col>
                    ))}
            </Row>

            {/* Render the AddButton if the object is expandable */}
            {canExpand(schema, uiSchema, formData) && (
              <Col span={24}>
                <Row gutter={rowGutter} justify="end">
                  <Col flex="192px">
                    {' '}
                    {/* Adjust flex value as needed */}
                    <AddButton
                      className="object-property-expand"
                      disabled={disabled || readonly}
                      onClick={onAddClick(schema)}
                      uiSchema={uiSchema}
                      registry={registry}
                    />
                  </Col>
                </Row>
              </Col>
            )}
          </span>
        );
      }}
    </ConfigConsumer>
  );
}
