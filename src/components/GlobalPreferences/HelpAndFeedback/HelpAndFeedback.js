import React from 'react'
import PropTypes from 'prop-types'
import { Box, Checkbox, Info, GU, useTheme } from '@aragon/ui'
import helpAndFeedbackSvg from './help-and-feedback.svg'

function HelpAndFeedback({ optedOut, onOptOutChange }) {
  const theme = useTheme()
  // checked => not opted out
  const handleOptOutChange = checked => onOptOutChange(!checked)

  return (
    <Box heading="Help Scout">
      <label
        css={`
          cursor: pointer;
          display: flex;
          margin-bottom: ${4 * GU}px;
          align-items: center;
          justify-content: center;
        `}
      >
        <Checkbox onChange={handleOptOutChange} checked={!optedOut} />
        <span
          css={`
            color: ${theme.surfaceContentSecondary};
            font-size: 20px;
          `}
        >
          Allow Help Scout feedback module
        </span>
      </label>
      <img
        src={helpAndFeedbackSvg}
        alt="Help Scout"
        css={`
          display: block;
          margin: 0 auto;
          margin-bottom: ${4 * GU}px;
          width: 300px;
          height: 156px;
        `}
      />
      <Info>
        Help Scout lets you easily browse the knowledge base and open tickets so
        you can get support when using Aragon organizations. Disabling it will
        disable that functionality as well.
      </Info>
    </Box>
  )
}

HelpAndFeedback.propTypes = {
  optedOut: PropTypes.bool,
  onOptOutChange: PropTypes.func.isRequired,
}

export default React.memo(HelpAndFeedback)